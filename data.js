const clients = {
    test1:{
        id:'test1@mesa.kr',
        client_name:'SBS',
        password:'123',
        business_info: {
            project_name: "PTL 교체 사업",
            delivered_equipment: 'NetBackUP',
            sales_person:'이준원',
            engineer:'김창규',
            startDate: '2024-06-01',
            endDate:'2024-12-31'
        },
        maintenance_data:{
            equipment1: [
                {
                    date: '2024-11-22',
                    cycle: '매월',
                    content: '정기 점검',
                    manager: '이영희'
                },
                {
                    date: '2024-12-22',
                    cycle: '매월',
                    content: '정기 점검',
                    manager: '이희'
                }
            ],
            equipment2: [
                {
                    date: '2024-12-15',
                    cycle: '2개월',
                    content: '부품 교체',
                    manager: '박민수'
                }
            ],
            equipment3: [
                {
                    date: '2024-11-30',
                    cycle: '3개월',
                    content: '소프트웨어 업데이트',
                    manager: '김지혜'
                }
            ],
            equipment4: [
                {
                    date: '2024-10-10',
                    cycle: '매주',
                    content: '상태 점검',
                    manager: '이상우'
                }
            ]
        }
    },
    test2:{
        id:'test2@mesa.kr',
        client_name:'KBS',
        password:'123',
        business_info: {
            project_name: "예시",
            delivered_equipment: '예시장비',
            sales_person:'이준원',
            engineer:'김창규'
        },
        maintenance_data:{
            equipment1: [
                {
                    date: '2024-11-22',
                    cycle: '매월',
                    content: '정기 점검',
                    manager: '이영희'
                },
                {
                    date: '2024-12-22',
                    cycle: '매월',
                    content: '필터 교체',
                    manager: '이영희'
                }
            ],
            equipment2: [
                {
                    date: '2024-12-15',
                    cycle: '2개월',
                    content: '부품 교체',
                    manager: '박수'
                }
            ],
            equipment3: [
                {
                    date: '2024-11-30',
                    cycle: '3개월',
                    content: '소프트웨어 업데이트',
                    manager: '김지혜'
                }
            ]
            // equipment4: [
            //     {
            //         date: '2024-10-10',
            //         cycle: '매주',
            //         content: '상태 점검',
            //         manager: '이상우'
            //     }
            // ]
        }
    },
    test3:{
        id:'test3@mesa.kr',
        client_name:'MBC',
        password:'123',
        business_info: {
            project_name: "예시",
            delivered_equipment: '예시장비',
            sales_person:'이준원',
            engineer:'김창규'
        },
        maintenance_data:{
        }
    },
    test4:{
        id:'test4@mesa.kr',
        client_name:'EBS',
        password:'123',
        business_info: {
            project_name: "예시",
            delivered_equipment: '예시장비',
            sales_person:'이준원',
            engineer:'김창규'
        },
        maintenance_data:{
            equipment1: [
                {
                    date: '2024-11-22',
                    cycle: '매월',
                    content: '정기 점검',
                    manager: '이영희'
                },
                {
                    date: '2024-12-22',
                    cycle: '매월',
                    content: '필터 교체',
                    manager: '이희'
                }
            ],
            equipment2: [
                {
                    date: '2024-12-15',
                    cycle: '2개월',
                    content: '부품 교체',
                    manager: '박민수'
                }
            ],
            equipment3: [
                {
                    date: '2024-11-30',
                    cycle: '3개월',
                    content: '소프트웨어 업데이트',
                    manager: '김지혜'
                }
            ],
            equipment4: [
                {
                    date: '2024-10-10',
                    cycle: '매주',
                    content: '상태 점검',
                    manager: '이상우'
                }
            ],
            equipment5: [
                {
                    date: '2024-10-10',
                    cycle: '매주',
                    content: '상태 점검',
                    manager: '이상우'
                }
            ]
        }
    },
}

// ✅ 데이터를 내보내기 (필수)
module.exports = { clients };