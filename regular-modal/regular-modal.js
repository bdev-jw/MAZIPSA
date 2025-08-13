// 전역 객체에 초기화 함수 등록
window.initRegularModal = function() {
    initCalendar();
    
    document.getElementById("regularApplyBtn").addEventListener("click", () => {
        const selectedDates = document.getElementById("selectedDate").getAttribute("data-dates");
        const content = document.getElementById("regularContent").value;
        
        if (selectedDates && JSON.parse(selectedDates).length > 0 && content.trim() !== "") {
            addRegularApplication(JSON.parse(selectedDates), content);
            alert("정기 점검이 신청되었습니다.");
            closeModal(); // main.html에 정의된 전역 함수 사용
        } else {
            alert("날짜와 내용을 모두 입력해주세요.");
        }
    });
};

function addRegularApplication(dates, content) {
    if (window.regularApplications.length >= 10) window.regularApplications.shift();
    window.regularApplications.push({ dates, content, timestamp: new Date().toISOString() });
    updateRegularBadge();
}

function updateRegularBadge() {
    const regularIcon = document.getElementById("regularIcon");
    if (!regularIcon) return;
    
    regularIcon.querySelector(".badge")?.remove();
    if(window.regularApplications.length === 0) return;

    const allDates = window.regularApplications.flatMap(app => app.dates);
    if (allDates.length === 0) return;

    const earliestDate = allDates.sort()[0];
    const [year, month, day] = earliestDate.split('-');

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = `${month}/${day}`;
    regularIcon.appendChild(badge);
}

function initCalendar() {
    const calendarEl = document.getElementById("calendar");
    if (!calendarEl) return;
    calendarEl.innerHTML = "";
    
    const now = new Date();
    let currentYear = now.getFullYear();
    let currentMonth = now.getMonth();
    let selectedDates = [];

    const selectedDateElement = document.getElementById("selectedDate");
    selectedDateElement.setAttribute("data-dates", JSON.stringify([]));
    selectedDateElement.textContent = "날짜를 선택해주세요";
    
    // 캘린더 전체에 하나의 이벤트 리스너만 등록 (이벤트 위임)
    calendarEl.onclick = function(e) {
        if (e.target.classList.contains('prev-month')) {
            e.preventDefault();
            e.stopPropagation();
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar();
        } else if (e.target.classList.contains('next-month')) {
            e.preventDefault();
            e.stopPropagation();
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar();
        } else if (e.target.classList.contains('calendar-day') && e.target.dataset.date) {
            const date = e.target.dataset.date;
            const index = selectedDates.indexOf(date);
            if(index > -1) {
                selectedDates.splice(index, 1);
                e.target.classList.remove('selected');
            } else {
                selectedDates.push(date);
                e.target.classList.add('selected');
            }
            selectedDateElement.setAttribute("data-dates", JSON.stringify(selectedDates));
            selectedDateElement.textContent = selectedDates.length > 0 ? `선택된 날짜: ${selectedDates.length}개` : "날짜를 선택해주세요";
        }
    };
    
    function renderCalendar() {
        // renderCalendar 함수 내용은 동일하지만 이벤트 리스너 등록 부분은 제거
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
        const today = new Date();
        
        let calendarHTML = `
            <div class="calendar-header">
                <button class="prev-month" type="button">‹</button>
                <h3>${currentYear}년 ${currentMonth + 1}월</h3>
                <button class="next-month" type="button">›</button>
            </div>
            <div class="calendar-grid">`;
        
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        days.forEach(d => calendarHTML += `<div class="calendar-day-header">${d}</div>`);
        
        for(let i=0; i < firstDay; i++) calendarHTML += `<div></div>`;
        
        for(let i=1; i <= lastDate; i++) {
            const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            let classes = 'calendar-day';
            
            const dayOfWeek = new Date(currentYear, currentMonth, i).getDay();
            
            if (dayOfWeek === 0) {
                classes += ' sunday';
            } else if (dayOfWeek === 6) {
                classes += ' saturday';
            }
            
            if (today.getFullYear() === currentYear && 
                today.getMonth() === currentMonth && 
                today.getDate() === i) {
                classes += ' today';
            }
            
            if(selectedDates.includes(dateString)) classes += ' selected';
            
            calendarHTML += `<div class="${classes}" data-date="${dateString}">${i}</div>`;
        }
        calendarHTML += `</div>`;
        calendarEl.innerHTML = calendarHTML;
    }
            renderCalendar();
        };
    
        
        // 날짜 클릭 이벤트
    calendarEl.querySelectorAll('.calendar-day').forEach(day => {
        day.addEventListener('click', (e) => {
            const date = e.target.dataset.date;
            if(!date) return;
            const index = selectedDates.indexOf(date);
            if(index > -1) {
                selectedDates.splice(index, 1);
                e.target.classList.remove('selected');
            } else {
                selectedDates.push(date);
                e.target.classList.add('selected');
            }
            selectedDateElement.setAttribute("data-dates", JSON.stringify(selectedDates));
            selectedDateElement.textContent = selectedDates.length > 0 ? `선택된 날짜: ${selectedDates.length}개` : "날짜를 선택해주세요";
        });
    });
