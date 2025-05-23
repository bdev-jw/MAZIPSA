require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// ✅ CORS 설정을 가장 먼저 적용 (다른 미들웨어보다 앞에 위치)
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'https://ma-helper.netlify.app' // 정확한 origin 추가
];

app.use(cors({
    origin: function(origin, callback) {
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

// ✅ Preflight 요청 처리
app.options('*', cors());

// ✅ 수동 CORS 헤더 설정 (추가 보장)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // OPTIONS 요청은 즉시 응답
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

app.use(express.json());

const data = require('./data.js');

// ✅ MongoDB 연결
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
    console.error("❌ 환경 변수 MONGODB_URI가 없습니다!");
    process.exit(1);
}

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

// ✅ 스키마 정의
const ClientSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    client_name: String,
    password: { type: String, required: true },
    business_info: Object,
    maintenance_data: { type: Object, default: {} }
});
const Client = mongoose.model('Client', ClientSchema);

// ✅ 초기 데이터 삽입 - 수정된 부분
const initializeData = async () => {
    console.log('📌 데이터 초기화 시작...');
    try {
        const existingCount = await Client.countDocuments();
        if (existingCount > 0) {
            console.log('✅ 기존 데이터가 존재하므로 초기화를 건너뜁니다.');
            return;
        }

        let insertCount = 0;
        for (const key in data.clients) {
            const clientData = { ...data.clients[key] }; // 깊은 복사

            // maintenance_data 구조 변환
            if (!clientData.maintenance_data) {
                clientData.maintenance_data = {};
            }

            // equipment 구조를 서버 형식으로 변환
            const convertedMaintenanceData = {};
            for (const equipKey in clientData.maintenance_data) {
                const equipData = clientData.maintenance_data[equipKey];
                if (equipData && equipData.name && equipData.records) {
                    convertedMaintenanceData[equipData.name] = equipData.records;
                } else if (equipData && equipData.name) {
                    // records가 없는 경우 빈 배열로 초기화
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
    } catch (error) {
        console.error('❌ 데이터 삽입 오류:', error);
        throw error;
    }
};

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
app.get('/api/engineers', (req, res) => {
    try {
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
    console.log('요청 헤더:', req.headers);
    console.log('요청 본문:', req.body);
    
    try {
        const { manager, client, project, equipment, date, content } = req.body;

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

        console.log("📌 처리할 데이터:", { manager, client, project, equipment, date });

        // 클라이언트 검색 - client_name으로 정확히 찾기
        const clientDoc = await Client.findOne({ client_name: client });

        if (!clientDoc) {
            // 디버깅을 위해 모든 클라이언트 출력
            const allClients = await Client.find({}, 'client_name id');
            console.log("💡 DB에 저장된 클라이언트 목록:", allClients);
            return res.status(404).json({ 
                message: `고객사 '${client}'를 찾을 수 없습니다.`,
                availableClients: allClients.map(c => ({
                    name: c.client_name,
                    id: c.id
                }))
            });
        }

        console.log("✅ 클라이언트 찾음:", clientDoc.client_name);
        console.log("기존 maintenance_data:", JSON.stringify(clientDoc.maintenance_data, null, 2));

        // maintenance_data 구조 확인 및 생성
        if (!clientDoc.maintenance_data) {
            clientDoc.maintenance_data = {};
        }
        
        if (!clientDoc.maintenance_data[equipment]) {
            clientDoc.maintenance_data[equipment] = [];
        }

        // 새로운 기록 추가
        const newRecord = {
            date,
            cycle: "비정기",
            content,
            manager
        };

        clientDoc.maintenance_data[equipment].push(newRecord);

        // MongoDB에 저장
        await clientDoc.save();
        
        console.log(`✅ 기록 저장 성공: ${clientDoc.client_name} - ${equipment}`);
        console.log("저장된 기록:", newRecord);

        res.json({
            message: "엔지니어 기록 저장 성공",
            savedRecord: newRecord,
            client: clientDoc.client_name,
            equipment: equipment
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