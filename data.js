const clients = {
    test1:{
        id:'test1@mesa.kr',
        client_name:'(주)에스비에스(SBS)',
        password:'123',
        business_info: {
            project_name: "방송 IT 통합 유지보수",
            delivered_equipment: 'Nutanix',
            sales_person:'최성영',
            engineer:'김두현',
            startDate: '2024-01-01',
            endDate:'2025-12-31',
            logoPath: "/public/sbs.png"
        },
        maintenance_data:{
            equipment1: {
                name: "NUTANIX",
                records: [
                {
                    date: '2025-01-21',
                    cycle: '발생시',
                    content: 'TS4500 I/0 Slot 장애처리',
                    manager: '강영구'
                },
                {
                    date: '2025-01-16',
                    cycle: '발생시',
                    content: 'Tfinity , TS4500 마이그레이션',
                    manager: '강영구'
                },
                {
                    date: '2025-01-21',
                    cycle: '발생시',
                    content: '장애 처리 및 테스트',
                    manager: '김두현'
                },
                {
                    date: '2025-01-21',
                    cycle: '발생시',
                    content: '장애 처리',
                    manager: '황인성'
                },
                {
                    date: '2025-01-21',
                    cycle: '발생시',
                    content: 'TS4500 I/0 Slot 장애처리',
                    manager: '한형구'
                },
                {
                    date: '2025-01-21',
                    cycle: '발생시',
                    content: 'TS4500 I/0 Slot 장애처리',
                    manager: '강영구'
                },
                {
                    date: '2025-01-21',
                    cycle: '발생시',
                    content: 'TS4500 I/0 Slot 장애처리',
                    manager: '강영구'
                },
                {
                    date: '2025-01-21',
                    cycle: '발생시',
                    content: 'TS4500 I/0 Slot 장애처리',
                    manager: '강영구'
                },
                {
                    date: '2025-01-21',
                    cycle: '발생시',
                    content: 'TS4500 I/0 Slot 장애처리',
                    manager: '강영구'
                }
            ]
        }
            }
        },
        test2:{
            id:'test2@mesa.kr',
            client_name:'홈앤쇼핑',
            password:'123',
            business_info: {
                project_name: "25년도 유지보수",
                delivered_equipment: 'NBU(A)/INFOSCALE',
                sales_person:'신은철',
                engineer:'정재승/황인성',
                startDate: '2025-01-01',
                endDate:'2025-12-31',
                logoPath:'/public/homeshoping.svg'
            },
            maintenance_data:{
                equipment1: {
                    name: "VRTS-NBU(A)",
                    records: [
                    {
                        date: '2025-03-24',
                        cycle: '발생시',
                        content: 'NBUA 5250 설치 지원',
                        manager: '강영구'
                    },
                    {
                        date: '2025-03-24',
                        cycle: '발생시',
                        content: '입고 임대장비 구성 및 RACK 재배치',
                        manager: '정재승'
                    },
                    {
                        date: '2025-03-17',
                        cycle: '발생시',
                        content: '임대장비 입고 및 업그레이드',
                        manager: '정재승'
                    },
                    {
                        date: '2025-03-17',
                        cycle: '발생시',
                        content: 'NBUA 5240 업그레이드',
                        manager: '강영구'
                    },
                    {
                        date: '2025-03-05',
                        cycle: '발생시',
                        content: '업그레이드',
                        manager: '정재승'
                    },
                    {
                        date: '2025-02-16',
                        cycle: '발생시',
                        content: 'DB백업 장애처리',
                        manager: '정재승'
                    },
                    {
                        date: '2025-01-02',
                        cycle: '발생시',
                        content: '인증서 만료 오류 조치 처리',
                        manager: '김수호'
                    }
                ]
            }            
            }
        }
    }
    

const engineers = [
    
  
    
  
    // 추가 엔지니어를 이 패턴으로 계속 추가하면 됨
  ];

// ✅ 브라우저 환경이면 전역 변수 등록
if (typeof window !== 'undefined') {
    window.engineers = engineers;
    window.clients = clients;
  }
  
  // ✅ Node.js 환경이면 모듈로 내보내기
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { engineers, clients };
  }