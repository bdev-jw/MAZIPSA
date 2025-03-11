require('dotenv').config(); // ✅ .env 파일 로드
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const data = require('./data.js'); // ✅ 기존 데이터 불러오기

// ✅ MongoDB Atlas 연결
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
    console.error("❌ 환경 변수 MONGODB_URI가 설정되지 않았습니다!");
    process.exit(1); // 서버 종료
}

mongoose.connect(mongoURI)
    .then(() => {
        console.log('✅ MongoDB Atlas에 연결됨');

        // ✅ 데이터 초기화 실행 후 서버 시작
        initializeData().then(() => {
            app.listen(3000, () => console.log('🚀 서버가 3000번 포트에서 실행 중...'));
        }).catch(error => {
            console.error('❌ 초기 데이터 삽입 중 오류 발생:', error);
            process.exit(1);
        });

    })
    .catch(err => {
        console.error('❌ MongoDB 연결 오류:', err);
        process.exit(1);
    });

// ✅ MongoDB 클라이언트 스키마
const ClientSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    client_name: String,
    password: { type: String, required: true },
    business_info: Object,
    maintenance_data: { type: Object, default: {} }
});
const Client = mongoose.model('Client', ClientSchema);

// ✅ 데이터 초기화 함수
const initializeData = async () => {
    console.log('📌 MongoDB 데이터 초기화 시작...');
    try {
        await Client.deleteMany({});
        console.log('🗑 기존 데이터를 삭제했습니다.');

        let insertCount = 0;
        for (const key in data.clients) {
            const clientData = data.clients[key];

            if (!clientData.maintenance_data) {
                clientData.maintenance_data = {};
            }

            const newClient = new Client(clientData);
            await newClient.save();
            insertCount++;
            console.log(`✅ ${newClient.id} 데이터 삽입 완료!`);
        }

        console.log(`🚀 총 ${insertCount}개의 데이터를 삽입했습니다.`);
    } catch (error) {
        console.error('❌ 데이터 삽입 중 오류 발생:', error);
        throw error;
    }
};

// ✅ 로그인 API
app.post('/api/login', async (req, res) => {
    const { id, password } = req.body;
    const client = await Client.findOne({ id, password });

    if (client) {
        res.json(client);
    } else {
        res.status(401).json({ message: 'ID 또는 비밀번호가 잘못되었습니다.' });
    }
});

// ✅ 현재 로그인한 사용자의 데이터 가져오기 API
app.get('/api/client/:id', async (req, res) => {
    try {
        const client = await Client.findOne({ id: req.params.id });
        if (!client) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }
        res.json(client);
    } catch (error) {
        res.status(500).json({ message: "서버 오류", error });
    }
});

// ✅ 유지보수 정보 조회 API
app.get('/api/maintenance/:clientId', async (req, res) => {
    try {
        const client = await Client.findOne({ id: req.params.clientId });
        if (!client) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }
        res.json(client.maintenance_data);
    } catch (error) {
        res.status(500).json({ message: "서버 오류", error });
    }
});

// ✅ 유지보수 정보 추가 API
app.post('/api/maintenance/:clientId', async (req, res) => {
    try {
        const { equipment, date, cycle, content, manager } = req.body;
        const client = await Client.findOne({ id: req.params.clientId });

        if (!client) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        if (!client.maintenance_data[equipment]) {
            client.maintenance_data[equipment] = [];
        }

        client.maintenance_data[equipment].push({ date, cycle, content, manager });
        await client.save();

        res.json({ message: "유지보수 정보가 추가되었습니다.", maintenance_data: client.maintenance_data });
    } catch (error) {
        res.status(500).json({ message: "서버 오류", error });
    }
});

// ✅ 파일 업로드 설정 (multer)
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

// ✅ 파일 업로드 API
app.post('/api/upload', upload.single('file'), (req, res) => {
    res.json({ message: '파일 업로드 성공', filename: req.file.filename });
});