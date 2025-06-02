require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const data = require('./data.js');

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'https://ma-helper.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS 정책에 의해 차단됨: ' + origin));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

app.options('*', cors());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());

// ✅ MongoDB 연결
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error("❌ 환경 변수 MONGODB_URI가 없습니다!");
  process.exit(1);
}

// ✅ 스키마 정의
const ClientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  client_name: String,
  password: { type: String, required: true },
  business_info: Object,
  maintenance_data: { type: Object, default: {} }
});
const Client = mongoose.model('Client', ClientSchema);

const EngineerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  password: String,
  name: String,
  gender: String,
  position: String,
  experience: String,
  photo: String,
  assignments: Array
});
const Engineer = mongoose.model('Engineer', EngineerSchema);

// ✅ 데이터 초기화
const initializeData = async () => {
  console.log('📌 데이터 초기화 시작...');
  try {
    const existingClients = await Client.countDocuments();
    const existingEngineers = await Engineer.countDocuments();

    // 기존 데이터가 있는지 확인
    if (existingClients > 0 && existingEngineers > 0) {
      console.log('✅ 기존 데이터가 존재하므로 초기화를 건너뜁니다.');
      return;
    }

    // === 클라이언트 삽입 ===
    if (existingClients === 0) {
      let insertCount = 0;
      for (const key in data.clients) {
        const clientData = { ...data.clients[key] };

        const convertedMaintenanceData = {};
        for (const equipKey in clientData.maintenance_data) {
          const equipData = clientData.maintenance_data[equipKey];
          if (equipData && equipData.name && equipData.records) {
            convertedMaintenanceData[equipData.name] = equipData.records;
          } else if (equipData && equipData.name) {
            convertedMaintenanceData[equipData.name] = [];
          }
        }
        clientData.maintenance_data = convertedMaintenanceData;

        const newClient = new Client(clientData);
        await newClient.save();
        insertCount++;
        console.log(`✅ ${newClient.id} (${newClient.client_name}) 저장됨`);
      }
      console.log(`🚀 총 ${insertCount}개 클라이언트 저장 완료`);
    }

    // === 엔지니어 삽입 ===
    if (existingEngineers === 0) {
      await Engineer.insertMany(data.engineers);
      console.log(`🚀 총 ${data.engineers.length}명 엔지니어 저장 완료`);
    } else {
      console.log('✅ 기존 엔지니어 데이터가 존재하므로 초기화를 건너뜁니다.');
    }

  } catch (error) {
    console.error('❌ 초기화 오류:', error);
    throw error;
  }
};

mongoose.connect(mongoURI)
  .then(() => {
    console.log('✅ MongoDB Atlas 연결됨');
    initializeData().then(() => {
      const port = process.env.PORT || 3000;
      app.listen(port, '0.0.0.0', () => {
        console.log(`🚀 서버 실행 중 (포트 ${port})...`);
        console.log(`🌐 접근 가능한 주소: http://localhost:${port}`);
      });
    }).catch(error => {
      console.error('❌ 초기화 오류:', error);
      process.exit(1);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB 연결 실패:', err);
    process.exit(1);
  });

// ✅ 고객사 로그인
app.post('/api/login', async (req, res) => {
    try {
        const { id, password } = req.body;
        const client = await Client.findOne({ id, password });

        if (client) {
            res.json(client);
        } else {
            res.status(401).json({ message: 'ID 또는 비밀번호가 잘못되었습니다.' });
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({ message: '서버 오류', error: error.message });
    }
});

// ✅ 클라이언트 데이터 조회
app.get('/api/client/:id', async (req, res) => {
    try {
        const client = await Client.findOne({ id: req.params.id });
        if (!client) return res.status(404).json({ message: "사용자 없음" });
        res.json(client);
    } catch (error) {
        console.error('클라이언트 조회 오류:', error);
        res.status(500).json({ message: "서버 오류", error: error.message });
    }
});

// ✅ 유지보수 조회
app.get('/api/maintenance/:clientId', async (req, res) => {
    try {
    const client = await Client.findOne({ id: req.params.clientId }); // ← 수정 포인트

    if (!client) {
      return res.status(404).json({ message: "고객사를 찾을 수 없습니다." });
    }

    res.json(client.maintenance_data);
  } catch (error) {
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
});

// ✅ 유지보수 추가 (고객사)
app.post('/api/maintenance/:clientId', async (req, res) => {
    try {
        const { equipment, date, cycle, content, manager } = req.body;
        const client = await Client.findOne({ id: req.params.clientId });

        if (!client) return res.status(404).json({ message: "사용자 없음" });

        if (!client.maintenance_data[equipment]) {
            client.maintenance_data[equipment] = [];
        }

        client.maintenance_data[equipment].push({ date, cycle, content, manager });
        await client.save();

        res.json({ message: "추가 완료", maintenance_data: client.maintenance_data });
    } catch (error) {
        console.error('유지보수 추가 오류:', error);
        res.status(500).json({ message: "서버 오류", error: error.message });
    }
});

// ✅ 엔지니어 목록 조회
app.get('/api/engineers', async (req, res) => {
    try {
        const engineers = await Engineer.find({});
        if (!data.engineers || data.engineers.length === 0) {
            return res.status(404).json({ message: '엔지니어 정보 없음' });
        }
        res.json(data.engineers);
    } catch (error) {
        console.error('엔지니어 목록 조회 오류:', error);
        res.status(500).json({ message: '서버 오류', error: error.message });
    }
});

// ✅ 엔지니어 로그인 확인
app.post('/api/engineer-login', (req, res) => {
    try {
        const { id, password } = req.body;
        const found = data.engineers.find(e => e.id === id && e.password === password);
        if (found) {
            res.json({ id: found.id, name: found.name });
        } else {
            res.status(401).json({ message: 'ID 또는 비밀번호가 잘못되었습니다.' });
        }
    } catch (error) {
        console.error('엔지니어 로그인 오류:', error);
        res.status(500).json({ message: '서버 오류', error: error.message });
    }
});

// ✅ 엔지니어 기록 저장 API - 완전히 수정된 버전
app.post('/api/engineer-record', async (req, res) => {
    console.log('📌 엔지니어 기록 저장 요청 받음');
    console.log('요청 본문:', req.body);

    try {
        let { manager, client, project, equipment, date, content } = req.body;

        // 필수 항목 검사
        if (!manager || !client || !project || !equipment || !date || !content) {
            console.log('❌ 필수 항목 누락:', { manager, client, project, equipment, date, content });
            return res.status(400).json({
                message: '필수 항목 누락',
                missing: {
                    manager: !manager,
                    client: !client,
                    project: !project,
                    equipment: !equipment,
                    date: !date,
                    content: !content
                }
            });
        }

        // 장비 이름을 대문자로 표준화
        const equipmentKey = equipment.trim().toUpperCase();

        // 고객사 문서 조회
        const clientDoc = await Client.findOne({ client_name: client });

        if (!clientDoc) {
            const allClients = await Client.find({}, 'client_name id');
            console.log("❌ 고객사를 찾을 수 없습니다:", client);
            return res.status(404).json({
                message: `고객사 '${client}'를 찾을 수 없습니다.`,
                availableClients: allClients.map(c => ({
                    name: c.client_name,
                    id: c.id
                }))
            });
        }

        console.log("✅ 고객사 찾음:", clientDoc.client_name);

        // maintenance_data 구조 초기화
        if (!clientDoc.maintenance_data) {
            clientDoc.maintenance_data = {};
        }

        // 해당 장비 키가 없거나 배열이 아니면 새 배열 생성
        if (!Array.isArray(clientDoc.maintenance_data[equipmentKey])) {
            console.log(`⚠️ '${equipmentKey}' 장비에 대한 기록이 없거나 형식이 잘못됨. 새로 생성.`);
            clientDoc.maintenance_data[equipmentKey] = [];
        }

        // 기록 추가
        const newRecord = {
            date,
            cycle: "비정기",
            content,
            manager
        };

        clientDoc.maintenance_data[equipmentKey].push(newRecord);

        // ❗ 이 줄이 반드시 있어야 DB에 반영됨
        clientDoc.markModified(`maintenance_data.${equipmentKey}`);

        // MongoDB에 저장
        await clientDoc.save();

        console.log(`✅ 기록 저장 성공: ${clientDoc.client_name} - ${equipmentKey}`);
        console.log("📄 저장된 기록:", newRecord);

        res.json({
            message: "엔지니어 기록 저장 성공",
            savedRecord: newRecord,
            client: clientDoc.client_name,
            equipment: equipmentKey
        });

    } catch (error) {
        console.error("❌ 기록 저장 오류:", error);
        res.status(500).json({
            message: "서버 오류",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// ✅ 파일 업로드
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/';
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        res.json({ message: '파일 업로드 성공', filename: req.file.filename });
    } catch (error) {
        console.error('파일 업로드 오류:', error);
        res.status(500).json({ message: '파일 업로드 실패', error: error.message });
    }
});

// ✅ 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// ✅ 테스트 API
app.get('/api/test', (req, res) => {
    res.json({ 
        message: "테스트 성공: 서버가 작동 중입니다.",
        timestamp: new Date().toISOString(),
        cors: "CORS 설정 완료"
    });
});

// ✅ 클라이언트 목록 조회 API 추가 (디버깅용)
app.get('/api/clients', async (req, res) => {
    try {
        const clients = await Client.find({}, 'client_name id business_info.project_name');
        res.json({
            message: "클라이언트 목록 조회 성공",
            count: clients.length,
            clients: clients
        });
    } catch (error) {
        console.error('클라이언트 목록 조회 오류:', error);
        res.status(500).json({ message: "서버 오류", error: error.message });
    }
});

// ✅ 404 에러 처리
app.use((req, res) => {
    console.log(`❌ 404 - 경로를 찾을 수 없음: ${req.method} ${req.path}`);
    res.status(404).json({ 
        message: '경로를 찾을 수 없습니다',
        requestedPath: req.path,
        method: req.method
    });
});

// ✅ 전역 에러 처리
app.use((error, req, res, next) => {
    console.error('❌ 서버 오류:', error);
    res.status(500).json({ 
        message: '서버 내부 오류',
        error: process.env.NODE_ENV === 'development' ? error.message : '서버 오류가 발생했습니다'
    });
});