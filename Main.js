$(function () {
    toastr.options = {
        "closeButton": false,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "positionClass": "toast-top-center",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    }
    workinDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    plannedPTODays = [];
    

    
    initializeCalendar();
    initialize();
    
});

function clickMe(ele) {    
    if (workinDays.includes(ele.getAttribute("data-day"))) {
        $(ele).find('input[type="checkbox"]').prop("checked", !$(ele).find('input[type="checkbox"]').prop("checked"));        
                
        if ($(ele).find('input[type="checkbox"]').is(':checked')) {
            ele.setAttribute('style', 'background-color:#dbef96');
            if (!plannedPTODays.includes($(ele).find('input[type="checkbox"]').val())) {
                plannedPTODays.push($(ele).find('input[type="checkbox"]').val());
            }

            initialize();            
        }
        else {
            ele.removeAttribute('style');
            var index = plannedPTODays.indexOf($(ele).find('input[type="checkbox"]').val());
            if (index !== -1) {
                plannedPTODays.splice(index, 1);
            }

            initialize();
        }
    }    
}

function initialize() {
    today = new Date();
    let todayEleId = today.yyyymmdd(today.getFullYear(), today.getMonth() + 1, today.getDate());    
    document.getElementById(todayEleId).style.border = "1px solid #85C1E9";

    currentPTO = 0;
    maxPTO = Number(document.querySelector("#maxPTO").value);
    existingPTO = Number(document.querySelector("#existingPTO").value);
    hoursAccruedPerPD = Number(document.querySelector("#hoursAccruedPerPD").value);
    paydays = [];
    activePaydays = [];
    paydaysNeedingDeductions = {};
    firstPayday = "";    

    if (validateInteger(maxPTO) && validateInteger(existingPTO) && validateInteger(hoursAccruedPerPD)) {
        calculatePaydays();
        addPDLabels(paydays);

        activePaydays = paydays.filter(x => { if (toUTC(new Date(x)) >= today) { return x; } });       

        currentPTO = existingPTO;
        paydaysNeedingDeductions = getPayDaysNeedingDeductions(activePaydays, plannedPTODays);
        calculatePTO(activePaydays, hoursAccruedPerPD, paydaysNeedingDeductions);
    }    
}

function initializeCalendar() {
    plannedPTODays = [];
    let dataYear = document.querySelector("#currentYear").value;
    document.querySelector(".year").setAttribute("data-year", dataYear);
    fillCalendar($(".year").attr('data-year'));    
}

function updateCalendar() {
    let dataYear = document.querySelector("#currentYear").value;
    if (validateCurrentYear(dataYear)) {
        var x = document.querySelectorAll(".year ul");
        x.forEach((ul) => {
            while (ul.firstChild) {
                ul.removeChild(ul.firstChild);
            }
        });
        initializeCalendar();
        initialize();
    }
}

function validateCurrentYear(year) {
    var text = /^[0-9]+$/;    
    if (year === "") {
        toastr["error"]("Please enter current year", "Current Year").css({ "font-family": "sans-serif", "font-size": "12px" });
        return false;
    }
    if ((year != "") && (!text.test(year))) {
        toastr["error"]("Please enter numeric values only", "Current Year").css({ "font-family": "sans-serif", "font-size": "12px" });            
        return false;
    }

    if (year.length != 4) {
        toastr["error"]("Please follow year format yyyy", "Current Year").css({ "font-family": "sans-serif", "font-size": "12px" });
        return false;
    }        
    return true;    
}

function validateInteger(number) {
    if (!/^\d+$/.test(number)) {
        toastr["error"]("Please enter an Integer").css({ "font-family": "sans-serif", "font-size": "12px" });
        return false;
    }
    return true;
}

function calculatePaydays() {
    firstPayday = document.querySelector("#firstPayday").value;
    for (let i = 0; i < 26; i++) {
        paydays.push(firstPayday);
        firstPayday = addDays(firstPayday, 14);
    }
}

function addDays(payday, days) {
    var date = toUTC(new Date(payday));
    date.setDate(date.getDate() + days);    
    return date.yyyymmdd(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function updatePaydays() {
    removePDLabels();
    initialize();
}

function fillCalendar(year) {
    var i;
    for (i = 0; i < 12; i++) {
        renderMonth(i + 1, year);
    }
}

function renderMonth(month, year) {   
    const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var first_day = new Date(year + "-" + month),
        last_day = new Date();
    last_day.setYear(year);
    last_day.setMonth(month);
    last_day.setDate(0);

    var i, l = last_day.getDate() + 1, d;
    for (i = 1; i < l; i++) {
        d = toUTC(new Date(year + "-" + month + "-" + i));
        $(".year[data-year='" + year + "'] ." + month).append("<li id=\"" + d.yyyymmdd(year, month, i) + "\" data-day=\"" + weekday[d.getDay()] + "\"  data-date=\"" + i + addDateSubscript(i) + "\" onclick=\"clickMe(this)\"><input type=\"checkbox\" value=\"" + d.yyyymmdd(year, month, i) + "\" style=\"display:none\"></li>");
        
    }
}

function toUTC(date) {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}

function addDateSubscript(d) {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
    }
}

Date.prototype.yyyymmdd = function (year, month, day) {
    return  year + '-' +
            (month > 9 ? '' : '0') + month + "-" +
            (day > 9 ? '' : '0') + day;
};

function addPDLabels(paydays) {
    paydays.forEach(function (id) {
        var ele = document.getElementById(id);
        var checked = $(ele).find('input[type="checkbox"]').is(':checked');
        if (ele) {            
            ele.innerHTML = "<input type=\"checkbox\" value=\"" + id + "\" style=\"display:none\"><div id=\"" + id + "-div\" style=\" margin-left:17%; width:35%; \"><span style=\"position: absolute; margin-top:5px; font-family:sans-serif; border-radius: 25px; text-align:center; display:inline-block; width: 20px; margin-left:30px; background-color:#73AD21; font-size:11px; color:white;\">PD</span></div>";
            if (checked) {
                $(ele).find('input[type="checkbox"]').prop("checked", checked);
            }
        }        
    });
}

function removePDLabels() {
    var x = document.querySelectorAll(".year ul li");
    x.forEach((li) => {
        if ($(li).children("div").text()) { li.removeChild(li.childNodes[1]); }

    });
}

function getClosestSucceedingPayDay(activePaydays, plannedPTODay) {
    var closestPDIndex = activePaydays.sort(function (a, b) { toUTC(new Date(a)) - toUTC(new Date(b)); })
        .findIndex(x => toUTC(new Date(x)) >= toUTC(new Date(plannedPTODay)));

    var threeDaysPriorToClosestPD = toUTC(new Date(activePaydays[closestPDIndex]));
    var closestPD = toUTC(new Date(activePaydays[closestPDIndex]));
    threeDaysPriorToClosestPD.setDate(closestPD.getDate() - 3);    

    if (toUTC(new Date(plannedPTODay)) >= threeDaysPriorToClosestPD && toUTC(new Date(plannedPTODay)) <= toUTC(new Date(activePaydays[closestPDIndex]))) {
        return activePaydays[closestPDIndex + 1];
           
    } else {
        return activePaydays[closestPDIndex];
    }
}

function getPayDaysNeedingDeductions(activePaydays, plannedPTODays) {
    var paydaysNeedingDeductions = new Object;
    plannedPTODays.forEach((plannedPTODay) => {
        var closestPayDay = getClosestSucceedingPayDay(activePaydays, plannedPTODay);
        if (closestPayDay in paydaysNeedingDeductions) {
            paydaysNeedingDeductions[closestPayDay] += 8;
        }
        else {
            paydaysNeedingDeductions[closestPayDay] = 8;
        }
    });
    return paydaysNeedingDeductions;
}

function calculatePTO(activePaydays, hoursAccruedPerPayCheck, paydaysNeedingDeductions) {
    let newPTO = 0;
    activePaydays.forEach((payday) => {
        if (payday in paydaysNeedingDeductions) {
            let calculatedValueWithDeductions = currentPTO - paydaysNeedingDeductions[payday] + hoursAccruedPerPayCheck;
            newPTO = calculatedValueWithDeductions > maxPTO ? maxPTO : calculatedValueWithDeductions;
            
            var ele = document.getElementById(payday+"-div");
            if (ele) {
                ele.innerHTML += "<span style=\"position:absolute; border-radius: 25px; margin-top:5px; text-align:center; display:inline-block; width: 28px; margin-right:30px; background-color:#5DADE2; font-size:11px; font-family:sans-serif; color:white; \">" + newPTO + "</span>";
                
            }
        }
        else {
            let calculatedValueWithoutDeductions = currentPTO + hoursAccruedPerPayCheck;
            newPTO = calculatedValueWithoutDeductions > maxPTO ? maxPTO : calculatedValueWithoutDeductions;
            
            var ele = document.getElementById(payday + "-div");
            if (ele) {
                ele.innerHTML += "<span style=\"position:absolute; border-radius: 25px; margin-top:5px; text-align:center; display:inline-block; width: 28px; margin-right:30px; background-color:#5DADE2; font-size:11px; font-family:sans-serif; color:white; \">" + newPTO + "</span>";

            }
        }
        currentPTO = newPTO;
    });
}


