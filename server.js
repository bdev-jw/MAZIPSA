require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
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
            app.listen(3000, () => console.log('🚀 서버 실행 중 (포트 3000)...'));
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

// ✅ 초기 데이터 삽입
const initializeData = async () => {
    console.log('📌 데이터 초기화 시작...');
    try {
        await Client.deleteMany({});
        console.log('🗑 기존 데이터 삭제 완료');

        let insertCount = 0;
        for (const key in data.clients) {
            const clientData = data.clients[key];

            if (!clientData.maintenance_data) {
                clientData.maintenance_data = {};
            }

            const newClient = new Client(clientData);
            await newClient.save();
            insertCount++;
            console.log(`✅ ${newClient.id} 저장됨`);
        }

        console.log(`🚀 총 ${insertCount}개 클라이언트 저장 완료`);
    } catch (error) {
        console.error('❌ 데이터 삽입 오류:', error);
        throw error;
    }
};

// ✅ 고객사 로그인
app.post('/api/login', async (req, res) => {
    const { id, password } = req.body;
    const client = await Client.findOne({ id, password });

    if (client) {
        res.json(client);
    } else {
        res.status(401).json({ message: 'ID 또는 비밀번호가 잘못되었습니다.' });
    }
});

// ✅ 클라이언트 데이터 조회
app.get('/api/client/:id', async (req, res) => {
    try {
        const client = await Client.findOne({ id: req.params.id });
        if (!client) return res.status(404).json({ message: "사용자 없음" });
        res.json(client);
    } catch (error) {
        res.status(500).json({ message: "서버 오류", error });
    }
});

// ✅ 유지보수 조회
app.get('/api/maintenance/:clientId', async (req, res) => {
    try {
        const client = await Client.findOne({ id: req.params.clientId });
        if (!client) return res.status(404).json({ message: "사용자 없음" });
        res.json(client.maintenance_data);
    } catch (error) {
        res.status(500).json({ message: "서버 오류", error });
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
        res.status(500).json({ message: "서버 오류", error });
    }
});

// ✅ 엔지니어 목록 조회
app.get('/api/engineers', (req, res) => {
    if (!data.engineers || data.engineers.length === 0) {
        return res.status(404).json({ message: '엔지니어 정보 없음' });
    }
    res.json(data.engineers);
});

// ✅ 엔지니어 로그인 확인
app.post('/api/engineer-login', (req, res) => {
    const { id, password } = req.body;
    const found = data.engineers.find(e => e.id === id && e.password === password);
    if (found) {
        res.json({ id: found.id });
    } else {
        res.status(401).json({ message: 'ID 또는 비밀번호가 잘못되었습니다.' });
    }
});

// ✅ 엔지니어 기록 저장 API ⭐ 핵심 추가 부분 ⭐
app.post('/api/engineer-record', async (req, res) => {
    try {
        const { manager, client, project, equipment, date, content } = req.body;

        if (!manager || !client || !project || !equipment || !date || !content) {
            return res.status(400).json({ message: '필수 항목 누락' });
        }

        const clientDoc = await Client.findOne({
            client_name: client,
            "business_info.project_name": project
        });

        if (!clientDoc) {
            return res.status(404).json({ message: '고객사 또는 프로젝트 찾을 수 없음' });
        }

        if (!clientDoc.maintenance_data[equipment]) {
            clientDoc.maintenance_data[equipment] = [];
        }

        clientDoc.maintenance_data[equipment].push({
            manager,
            date,
            content,
            cycle: "비정기"
        });

        await clientDoc.save();

        res.json({
            message: "엔지니어 기록 저장 성공",
            maintenance_data: clientDoc.maintenance_data
        });

    } catch (error) {
        console.error("❌ 기록 저장 오류:", error);
        res.status(500).json({ message: "서버 오류", error });
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
    res.json({ message: '파일 업로드 성공', filename: req.file.filename });
});

// ✅ 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));  // 이미지 전용
app.use(express.static(__dirname));  // 루트의 .html, .js 등

// ✅ SPA 기본 페이지 라우팅
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});