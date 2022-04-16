$.holdReady(true)

const starscale_hp      = [1, 1.05,  1.12,  1.21,  1.35 ]
const starscale_attack  = [1, 1.1,   1.22,  1.36,  1.53 ]
const starscale_healing = [1, 1.075, 1.175, 1.295, 1.445]
const school_longname = {"Abydos": "Abydos High School", "Gehenna": "Gehenna Academy", "Hyakkiyako": "Allied Hyakkiyako Academy", "Millennium": "Millennium Science School", "RedWinter": "Red Winter Federal Academy", "Shanhaijing": "Shanhaijing Senior Secondary School", "Trinity": "Trinity General School", "Valkyrie": "Valkyrie Police School", "Arius": "Arius Satellite School", "Others": "Others", "SRT": "SRT Special Academy"}
const label_smalltext_threshold = {'en':11, 'ja':5}
const label_enemy_smalltext_threshold = {'en':12, 'ja':6}
const terrain_dmg_bonus = {D: 0.8, C: 0.9, B: 1, A: 1.1, S: 1.2, SS: 1.3}
const terrain_block_bonus = {D: 0, C: 15, B: 30, A: 45, S: 60, SS: 75}


const skill_ex_upgrade_credits = [80000, 500000, 3000000, 10000000]
const skill_upgrade_credits = [5000, 7500, 60000, 90000, 300000, 450000, 1500000, 2400000, 4000000]

const stat_friendlyname = {
    "maxhp": "Max HP",
    "attack_power": "Attack",
    "defense_power": "Defense",
    "heal_power": "Healing",
    "maxhp_percent": "Max HP",
    "attack_power_percent": "Attack",
    "heal_power_percent": "Healing",
    "accuracy": "Accuracy",
    "critical": "Critical Rate",
    "critical_damage": "Critical Damage",
    "healing_received": "Recovery Rate",
    "cc_power_percent": "CC Power",
    "cc_resist_percent": "CC Resistance",
    "critical_resist": "Critical Res.",
    "critical_damage_resist": "Critical Dmg. Res."
}

var data = {}
const json_list = {
    common: "./data/common.json",
    raids: "./data/raids.json",
    students: "./data/students.json",
    localization: "./data/localization.json",
    stages: "./data/stages.json",
    enemies: "./data/enemies.json",
}

var loadedModule, student, studentList, loadedItem, loadedStage, region, regionID, userLang, student_bondalts, darkTheme, highContrast, raid, selectedEnemy
var studentSelectorModal, statPreviewModal
var header
var raid_difficulty = 0
var stat_preview_stars = 3
var stat_preview_weapon_stars = 1

var search_options = {
    "groupby": "none",
    "sortby": "default",
    "sortby_dir": 1,
    "filter": {
        "type": {
            "Striker": false,
            "Special": false
        },
        "role": {
            "Tank": false,
            "Attacker": false,
            "Healer": false,
            "Support": false,
            "TacticalSupport": false,
        },
        "stars": {
            3: false,
            2: false,
            1: false,
        },
        "attack_type": {
            "Explosive": false,
            "Piercing": false,
            "Mystic": false,
        },
        "defense_type": {
            "Light": false,
            "Heavy": false,
            "Special": false,
        },
        "school": {
            "Abydos": false,
            "Gehenna": false,
            "Hyakkiyako": false,
            "Millennium": false,
            "RedWinter": false,
            "Shanhaijing": false,
            "Trinity": false,
            "Valkyrie": false,
            "SRT": false,
            "Others": false,
        },
        "weapon_type": {
            "SG": false,
            "SMG": false,
            "AR": false,
            "GL": false,
            "HG": false,
            "SR": false,
            "RG": false,
            "MG": false,
            "MT": false,
        },
        "is_limited": {
            0: false,
            1: false,
            2: false,
        },
    }
}

loadJSON(json_list, function(result) {
    data = result
    $.holdReady(false)
})

if (localStorage.getItem("theme")) {
    $('body').toggleClass("theme-dark", (localStorage.getItem("theme") == 'dark'))
}

$(document).ready(function() {
    studentSelectorModal = new bootstrap.Modal(document.getElementById("modStudents"), {})
    statPreviewModal = new bootstrap.Modal(document.getElementById("modStatPreviewSettings"), {})
    header = $(".card-header")
  
    if (localStorage.getItem("region")) {
        loadRegion(localStorage.getItem("region"))
    } else {
        loadRegion(0)
    }

    if (localStorage.getItem("language")) {
        userLang = localStorage.getItem("language")
    } else {
        if (window.navigator.language == 'ja') {
            userLang = 'ja'
        } else {
            userLang = 'en'
        }  
    }
    data.students.sort((a,b) => a["name_"+userLang].localeCompare(b["name_"+userLang]))
    studentList = data.students.map(x => x)
    if (localStorage.getItem("theme")) {
        darkTheme = localStorage.getItem("theme")    
    } else {
        darkTheme = 'auto'
    }
    toggleDarkTheme(darkTheme)

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (darkTheme == 'auto') {
            $('body').toggleClass("theme-dark", event.matches)
            document.querySelector('meta[name="theme-color"]').setAttribute('content', $('body').hasClass('theme-dark') ? '#212529' : '#dee2e6')
        }
    })

    $('body').toggleClass("reduced-motion", false)
    if (localStorage.getItem("high_contrast")) {
        highContrast = (localStorage.getItem("high_contrast") == "true")
    } else {
        highContrast = (!CSS.supports('backdrop-filter', 'blur(1px)')) || window.matchMedia('(prefers-contrast: more)').matches 
    }
    document.querySelector('meta[name="theme-color"]').setAttribute('content', darkTheme ? '#212529' : '#dee2e6')
    $('body').toggleClass("high-contrast", highContrast)
    
    $(`#ba-navbar-regionselector-${regionID}`).addClass("active")
    $(`#ba-navbar-languageselector-${userLang}`).addClass("active")
    $(`#ba-navbar-themeswitcher-${darkTheme}`).addClass("active")
    $('#ba-navbar-contrast-toggle').prop('checked', highContrast)

    $(window).on('popstate', function() {
        var urlVars = new URL(window.location.href).searchParams
        if (urlVars.get("chara")) {
            loadStudent(urlVars.get("chara"))
        } else if (urlVars.get("item")) {
            loadItem(urlVars.get("item"))
        } else if (urlVars.get("raid")) {
            loadRaid(urlVars.get("item"))
        } else if (urlVars.get("stage")) {
            loadStage(urlVars.get("stage"))
        }
    })

    var urlVars = new URL(window.location.href).searchParams
    if (urlVars.get("chara")) {
        loadStudent(urlVars.get("chara"))
    } else if (urlVars.get("item")) {
        loadItem(urlVars.get("item"))
    } else if (urlVars.get("raid")) {
        loadRaid(urlVars.get("raid"))
    } else if (urlVars.get("stage")) {
        loadStage(urlVars.get("stage"))
    }else {
        loadModule('students')
    }
})

function loadModule(moduleName, entry=null) {
    if (moduleName == 'students') {
        loadedModule = 'students'
        $(".navbar-nav .nav-link").removeClass('active')
        $("#ba-navbar-link-students").addClass('active')
        $("#loaded-module").load('students.html', function() {
            loadRegion(regionID)
            loadLanguage(userLang)
            $(".tooltip").tooltip("hide")
            var urlVars = new URL(window.location.href).searchParams
        
            if (entry != null) {
                loadStudent(entry)
            } else if (urlVars.has("chara")) {
                loadStudent(urlVars.get("chara"))
            } else if (localStorage.getItem("chara")) {
                loadStudent(localStorage.getItem("chara"))
            } else {
                loadStudent("Aru")
            }
        
            populateStudentList()
        
            if (localStorage.getItem("chara_groupby")) {
                searchOptionSet('groupby', localStorage.getItem("chara_groupby"), false)
            } else {
                searchOptionSet('groupby', 'none', false)
            }
        
            if (localStorage.getItem("chara_sortby_dir")) {
                search_options["sortby_dir"] = parseInt(localStorage.getItem("chara_sortby_dir"))
            }

            if (localStorage.getItem("chara_sortby")) {
                searchSetOrder(localStorage.getItem("chara_sortby"), false, false)
            } else {
                searchSetOrder('default', false, false)
            }
        
            updateStudentList()
        
            window.setTimeout(function(){$("#loading-cover").fadeOut()},50)
        
            $('input[type=range]').trigger('oninput')
        
            $('#ba-student, #ba-student-list-btn').show()
        })
    } else if (moduleName == 'items') {
        loadedModule = 'items'
        $(".navbar-nav .nav-link").removeClass('active')
        $("#ba-navbar-link-items").addClass('active')
        var bgimg = new Image()
        bgimg.onload = function(){
            $("#ba-background").css('background-image', `url('${bgimg.src}')`)
        }
        bgimg.src = `images/background/BG_CraftChamber_Night.jpg`
        $("#loaded-module").load('items.html', function() {
            loadLanguage(userLang)
            $(".tooltip").tooltip("hide")
            var urlVars = new URL(window.location.href).searchParams
        
            if (entry != null) {
                loadItem(entry)
            } else if (urlVars.has("item")) {
                loadItem(urlVars.get("item"))
            } else if (localStorage.getItem("item")) {
                loadItem(localStorage.getItem("item"))
            } else {
                loadItem(0)
            }
            populateItemList()
            window.setTimeout(function(){$("#loading-cover").fadeOut()},50)
            $('#ba-item-list-container, #ba-item-details-container').show()
        })
    } else if (moduleName == 'raids') {
        loadedModule = 'raids'
        $(".navbar-nav .nav-link").removeClass('active')
        $("#ba-navbar-link-raids").addClass('active')
        var bgimg = new Image()
        bgimg.onload = function(){
            $("#ba-background").css('background-image', `url('${bgimg.src}')`)
        }
        bgimg.src = `images/background/BG_Raid.jpg`
        $("#loaded-module").load('raids.html', function() {
            loadLanguage(userLang)
            $(".tooltip").tooltip("hide")
            var urlVars = new URL(window.location.href).searchParams
        
            if (entry != null) {
                loadRaid(entry)
            } else if (urlVars.has("raid")) {
                loadRaid(urlVars.get("raid"))
            } else if (localStorage.getItem("raid")) {
                loadRaid(localStorage.getItem("raid"))
            } else {
                loadRaid("Binah")
            }
            populateRaidList("none")
            window.setTimeout(function(){$("#loading-cover").fadeOut()},50)
        })
    } else if (moduleName == 'stages') {
        loadedModule = 'stages'
        $(".navbar-nav .nav-link").removeClass('active')
        $("#ba-navbar-link-stages").addClass('active')
        var bgimg = new Image()
        bgimg.onload = function(){
            $("#ba-background").css('background-image', `url('${bgimg.src}')`)
        }
        bgimg.src = `images/background/BG_Raid.jpg`
        $("#loaded-module").load('stages.html', function() {
            loadLanguage(userLang)
            $(".tooltip").tooltip("hide")
            var urlVars = new URL(window.location.href).searchParams
        
            if (entry != null) {
                loadStage(entry)
            } else if (urlVars.has("stage")) {
                loadStage(urlVars.get("stage"))
            } else if (localStorage.getItem("stage")) {
                loadStage(localStorage.getItem("stage"))
            } else {
                loadStage(1011101)
            }
            populateStageList()
            window.setTimeout(function(){$("#loading-cover").fadeOut()},50)
        })
    }

}

function hookTooltips() {
    //hook bs tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))

    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    })
}

function populateStudentList() {

    var resultsHTML = ''

    $.each(data.students, function(i, el){
        if (el["released"][regionID])
        resultsHTML += getStudentListCardHTML(el)
    })

    // resultsHTML += `<div id="ba-student-select-header1" class="ba-student-group-header p-2" style="font-size: medium;grid-column: 1/-1;order: 0;"><h2>Abydos</h2></div>`
    resultsHTML += `<div id="ba-student-select-noresult" class="p-2" style="font-size: medium;display:none;grid-column: 1/-1;">No results.</div>`
    $("#ba-student-select-grid").html(resultsHTML)
    
}

function updateStudentList() {
    var grouping = search_options["groupby"]
    var dir = search_options["sortby_dir"]
    var searchTerm = $('#ba-student-search-text').val()
    var sortfunction

    switch (search_options["sortby"]) {
        case "default":
            sortfunction = ((a,b) => (a.default_order - b.default_order)*dir)
            break
        case "name":
            sortfunction = ((a,b) => a["name_"+userLang].localeCompare(b["name_"+userLang])*dir)
            break
        case "attack":
            sortfunction = ((a,b) => (b.attack_power_100 - a.attack_power_100)*dir)
            break
        case "defense":
            sortfunction = ((a,b) => (b.defense_power_100 - a.defense_power_100)*dir)
            break
        case "maxhp":
            sortfunction = ((a,b) => (b.maxhp_100 - a.maxhp_100)*dir)
            break
        case "healing":
            sortfunction = ((a,b) => (b.heal_power_100 - a.heal_power_100)*dir)
            break
        case "crit":
            sortfunction = ((a,b) => (b.critical - a.critical)*dir)
            break
        case "stability":
            sortfunction = ((a,b) => (b.stability - a.stability)*dir)
            break
        case "range":
            sortfunction = ((a,b) => (b.range - a.range)*dir)
            break
        case "accuracy":
            sortfunction = ((a,b) => (b.accuracy - a.accuracy)*dir)
            break
        case "evasion":
            sortfunction = ((a,b) => (b.evasion - a.evasion)*dir)
            break
    }

    var filterList = []
    $.each(search_options["filter"], function(i, el) {
        var allfalse = true, alltrue = true
        $.each(el, function(i2, el2) {
            allfalse = (allfalse && !el2)
            alltrue = alltrue && el2
        })
        if (!(allfalse || alltrue)) {
            filterList.push(i)
        }
    })

    studentList.sort(sortfunction)
    var count = 0

    $.each(studentList, function(i, el){
        if (el["released"][regionID]) {
            if (checkFilters(el, filterList, searchTerm)) {
                count++
                $('#ba-student-select-'+el['id']).show().css("order", count)
                switch (search_options["sortby"]) {
                    case "default": case "name":
                        $('#ba-student-select-'+el['id']+' .ba-label-text').text(el["name_"+userLang].replace(' (','\n(')).toggleClass('smalltext', el["name_"+userLang].length > label_smalltext_threshold[userLang]).toggleClass('ba-unhover-text', false)
                        $('#ba-student-select-'+el['id']+' .ba-hover-text').hide()
                        break
                    case "maxhp":
                        $('#ba-student-select-'+el['id']+' .ba-label-text').text(el.maxhp_100).toggleClass('smalltext', false).toggleClass('ba-unhover-text', true)
                        $('#ba-student-select-'+el['id']+' .ba-hover-text').show()
                        break 
                    case "attack":
                        $('#ba-student-select-'+el['id']+' .ba-label-text').text(el.attack_power_100).toggleClass('smalltext', false).toggleClass('ba-unhover-text', true)
                        $('#ba-student-select-'+el['id']+' .ba-hover-text').show()
                        break
                    case "defense":
                        $('#ba-student-select-'+el['id']+' .ba-label-text').text(el.defense_power_100).toggleClass('smalltext', false).toggleClass('ba-unhover-text', true)
                        $('#ba-student-select-'+el['id']+' .ba-hover-text').show()
                        break 
                    case "healing":
                        $('#ba-student-select-'+el['id']+' .ba-label-text').text(el.heal_power_100).toggleClass('smalltext', false).toggleClass('ba-unhover-text', true)
                        $('#ba-student-select-'+el['id']+' .ba-hover-text').show()
                        break 
                    case "accuracy":
                        $('#ba-student-select-'+el['id']+' .ba-label-text').text(el.accuracy).toggleClass('smalltext', false).toggleClass('ba-unhover-text', true)
                        $('#ba-student-select-'+el['id']+' .ba-hover-text').show()
                        break 
                    case "evasion":
                        $('#ba-student-select-'+el['id']+' .ba-label-text').text(el.evasion).toggleClass('smalltext', false).toggleClass('ba-unhover-text', true)
                        $('#ba-student-select-'+el['id']+' .ba-hover-text').show()
                        break
                    case "crit":
                        $('#ba-student-select-'+el['id']+' .ba-label-text').text(el.critical).toggleClass('smalltext', false).toggleClass('ba-unhover-text', true)
                        $('#ba-student-select-'+el['id']+' .ba-hover-text').show()
                        break 
                    case "stability":
                        $('#ba-student-select-'+el['id']+' .ba-label-text').text(el.stability).toggleClass('smalltext', false).toggleClass('ba-unhover-text', true)
                        $('#ba-student-select-'+el['id']+' .ba-hover-text').show()
                        break
                    case "range":
                        $('#ba-student-select-'+el['id']+' .ba-label-text').text(el.range).toggleClass('smalltext', false).toggleClass('ba-unhover-text', true)
                        $('#ba-student-select-'+el['id']+' .ba-hover-text').show()
                        break 
                }

            } else {
                $('#ba-student-select-'+el['id']).hide()
            }
        }
    })

    if (count == 0) {
        $('#ba-student-select-noresult').show()
    } else {
        $('#ba-student-select-noresult').hide()
    }
}

function checkFilters(student, filterList, searchTerm) {
    if (!student["released"][regionID]) return false
    if (filterList.length == 0) {
    } else {
        for (let i = 0; i < filterList.length; i++) {
            if (!search_options['filter'][filterList[i]][student[filterList[i]]]) return false
        }
    }
    return (searchTerm == "" || student[`name_${userLang}`].toLowerCase().includes(searchTerm.toLowerCase()))
}

function searchOptionSet(option, value, runSearch = true) {
    $(`#ba-student-search-${option} a`).removeClass("active")
    $(`#ba-student-search-${option} button`).removeClass("active")
    $(`#ba-student-search-${option}-${value}`).addClass("active")
    $(`#ba-student-search-sortby-stat`).text(data.localization.strings['student_search_filter_stat'][userLang]+" ")

    if (option == "sortby" && value != "default" && value != "name") {
        $(`#ba-student-search-sortby-stat`).addClass("active")
        $(`#ba-student-search-sortby-stat`).text($(`#ba-student-search-sortby-${value}`).text() + " ")
    }

    // $(`#ba-student-search-${option}-label`).text($(`#ba-student-search-${option}-${value}`).text())
    search_options[option] = value
    localStorage.setItem(`chara_${option}`, value)
    if (runSearch) {
        updateStudentList()  
    }
}

function searchSetOrder(value, runSearch = true, swapDir = true) {

    if (swapDir) {
        if (value == search_options["sortby"]) {
            search_options["sortby_dir"] = -search_options["sortby_dir"]
        } else {
            search_options["sortby_dir"] = 1
        }
    }

    $(`#ba-student-search-sortby a`).removeClass("active")
    $(`#ba-student-search-sortby button`).removeClass("active")
    $(`#ba-student-search-sortby-${value}`).addClass("active")
    $('#ba-student-search-sortby-stat').text(data.localization.strings['student_search_filter_stat'][userLang])
    $('.sort-direction-label').text("")

    $(`#ba-student-search-sortby-${value} > .sort-direction-label`).html((search_options["sortby_dir"] == 1) != (value == "name" || value == "default") ? '<i class="fa-solid fa-arrow-down-long ms-2"></i>' : '<i class="fa-solid fa-arrow-up-long ms-2"></i>')

    if (value != "default" && value != "name") {
        $('#ba-student-search-sortby-stat').addClass("active")
        $('#ba-student-search-sortby-stat').html($(`#ba-student-search-sortby-${value}`).html())
    }

    search_options["sortby"] = value
    localStorage.setItem('chara_sortby', value)
    localStorage.setItem('chara_sortby_dir', search_options["sortby_dir"])
    if (runSearch) {
        updateStudentList()  
    }
}

function searchSetFilter(prop, value, runSearch = true) {
    search_options["filter"][prop][value] = !search_options["filter"][prop][value]
    $(`#ba-student-search-filter-${prop}-${String(value).toLowerCase()}`).toggleClass("active", search_options["filter"][prop][value])
    if (runSearch) {
        updateStudentList()  
    }

}

function loadStudent(studentName) {
    if (loadedModule == 'students') {
        student = find(data.students,"name_dev",studentName)

        if (student.length == 1) {
            console.log(student[0])
            student = student[0]
    
    
            var charimg = new Image()
            charimg.onload = function() {
                // $('#ba-student-img').attr('src', 'images/student/' + student.student_img)
                // $('#ba-student-img-sm').attr('src', 'images/student/' + student.student_img)
                $('#ba-student-img').css('background-image', `url('${charimg.src}')`)
                $('#ba-student-img-sm').css('background-image', `url('${charimg.src}')`)
            }
            charimg.src = 'images/student/' + student.student_img
    
            // $('#ba-student-img').attr('src', 'images/student/' + student.student_img)
            // $('#ba-student-img-sm').attr('src', 'images/student/' + student.student_img)
            
            var bgimg = new Image()
            bgimg.onload = function(){
                $("#ba-background").css('background-image', `url('${bgimg.src}')`)
            }
            bgimg.src = `images/background/${student.background_img}.jpg`
    
            $('#ba-student-name').html(student[`name_${userLang}`].replace('(', '<small>(').replace(')', ')</small>'))
            //$('#ba-student-name-ja').text(student.name_ja)
            $("#ba-student-class").text(student.type).removeClass("bg-striker bg-special").addClass(`bg-${student.type.toLowerCase()}`)
            $("#ba-student-stars").html('<i class="fa-solid fa-star"></i>'.repeat(student.stars))
    
            $("#ba-student-limited").removeClass("ba-type-limited ba-type-event")
            switch (student.is_limited) {
                case 0:
                    //$("#ba-student-limited").hide()
                    $("#ba-student-limited").html('<i class="fa-solid fa-star"></i>'.repeat(student.stars))
                    break;
                case 1:
                    //$("#ba-student-limited").show()
                    $("#ba-student-limited").html('<i class="fa-solid fa-star"></i>'.repeat(student.stars) + ` (${data.localization.strings['rarity_limited'][userLang]})`)
                    //$("#ba-student-limited").tooltip('dispose').tooltip({title: getRichTooltip(null, 'Limited Recruitment', null, 'Student only available for a limited time through a recruitment banner.'), placement: 'top', html: true})
                    break;
                case 2:
                    //$("#ba-student-limited").show()
                    $("#ba-student-limited").html('<i class="fa-solid fa-star"></i>'.repeat(student.stars) + ` (${data.localization.strings['rarity_event'][userLang]})`)
                    //$("#ba-student-limited").tooltip('dispose').tooltip({title: getRichTooltip(null, 'Event Reward', null, 'Student only available for a limited time as an event reward.'), placement: 'top', html: true})
                    break;
            }
            
    
            $("#ba-student-role-label").text(data.localization.strings[`role_${student.role.toLowerCase()}`][userLang])
            $("#ba-student-role-icon").attr("src", `images/ui/Role_${student.role}.png`)
    
            $(".ba-skill, .ba-weapon-skill-plus").removeClass("bg-skill-explosive bg-skill-piercing bg-skill-mystic").addClass(`bg-skill-${student.attack_type.toLowerCase()}`)
            $("#ba-student-attacktype").removeClass("bg-atk-explosive bg-atk-piercing bg-atk-mystic").addClass(`bg-atk-${student.attack_type.toLowerCase()}`)
            $("#ba-student-defensetype").removeClass("bg-def-light bg-def-heavy bg-def-special").addClass(`bg-def-${student.defense_type.toLowerCase()}`)
            
            $("#ba-student-school-label").text(student.school)
            //$("#ba-student-school").tooltip('dispose').tooltip({title: getRichTooltip(null, null, null, student.school.replace("RedWinter", "Red Winter")), placement: 'bottom', html: true})
            $("#ba-student-school-img").attr("src", "images/schoolicon/School_Icon_" + student.school.toUpperCase().replace(" ","") + "_W.png")
            $("#ba-student-position").text(student.position.toUpperCase())
            $("#ba-student-attacktype-label").text(data.localization.strings[`atk_${student.attack_type.toLowerCase()}`][userLang])
            $('#ba-student-attacktype').tooltip('dispose').tooltip({title: getRichTooltip(null, `${student.attack_type}`, 'Attack Type', null, getTypeText(student.attack_type), 32), placement: 'top', html: true})
            $("#ba-student-defensetype-label").text(data.localization.strings[`def_${student.defense_type.toLowerCase()}`][userLang])
            $('#ba-student-defensetype').tooltip('dispose').tooltip({title: getRichTooltip(null, `${student.defense_type} Armor`, 'Defense Type', null, getTypeText(student.defense_type), 32), placement: 'top', html: true})
    
            updateGearIcon()
            recalculateTerrainAffinity()
    
            if (student.uses_cover) {
                $("#ba-student-usescover-icon").show()
            } else {
                $("#ba-student-usescover-icon").hide()
            }
    
            $("#ba-student-weapontype-label").text(student.weapon_type)
            $(".ba-type-weapon").css("background-image", "url('images/weapontype/Weapon_Icon_" + student.weapon_type_img + ".png')")
    
            //Skills
            $("#ba-skill-ex-name").text(student[`skill_ex_name_${userLang}`] ? student[`skill_ex_name_${userLang}`] : student.skill_ex_name_ja)
            $("#ba-skill-normal-name").text(student[`skill_normal_name_${userLang}`] ? student[`skill_normal_name_${userLang}`] : student.skill_normal_name_ja)
            $("#ba-skill-passive-name").text(student[`skill_passive_name_${userLang}`] ? student[`skill_passive_name_${userLang}`] : student.skill_passive_name_ja)
            $("#ba-skill-sub-name").text(student[`skill_sub_name_${userLang}`] ? student[`skill_sub_name_${userLang}`] : student.skill_sub_name_ja)     
    
            $('#ba-skill-ex-icon').attr("src", "images/skill/" + student.skill_ex_icon)
            $('#ba-skill-normal-icon').attr("src", "images/skill/" + student.skill_normal_icon)
            $('#ba-skill-passive-icon').attr("src", "images/skill/" + student.skill_passive_icon)
            $('#ba-skill-sub-icon').attr("src", "images/skill/" + student.skill_sub_icon)
    
            student.skill_ex_cost[0] == student.skill_ex_cost[4] ? $("#ba-skill-ex-cost").removeClass("ba-col-explosive ba-col-piercing ba-col-mystic") : $("#ba-skill-ex-cost").removeClass("ba-col-explosive ba-col-piercing ba-col-mystic").addClass(`ba-col-${student.attack_type.toLowerCase()}`)
    
    
            //Skill materials
            var html
            for (let i = 2; i <= 5; i++) {
                html = ''
                $.each(student.skill_ex_upgrade_material[i-2], function(j, el) {
                    html += getMaterialIconHTML(el, student.skill_ex_upgrade_amount[i-2][j])
                })
                html += getMaterialIconHTML(0, abbreviateNumber(skill_ex_upgrade_credits[i-2]))
        
                $('#ba-skill-ex-materials-'+i).html(html)
                $('#ba-skill-ex-materials-'+i+' div').each(function(j,el) {
                    $(el).tooltip({html: true})
                })
            }
    
            for (let i = 2; i <= 9; i++) {
                html = ''
                $.each(student.skill_upgrade_material[i-2], function(j, el) {
                    html += getMaterialIconHTML(el, student.skill_upgrade_amount[i-2][j])
                })
                html += getMaterialIconHTML(0, abbreviateNumber(skill_upgrade_credits[i-2]))
        
                $('#ba-skill-materials-'+i).html(html)
                $('#ba-skill-materials-'+i+' div').each(function(j,el) {
                    $(el).tooltip({html: true})
                })
            }
    
            html = ''
            html += getMaterialIconHTML(9999, 1)
            html += getMaterialIconHTML(0, abbreviateNumber(skill_upgrade_credits[8]))
    
            $('#ba-skill-materials-10').html(html)
            $('#ba-skill-materials-10 div').each(function(i,el) {
                $(el).tooltip({html: true})
            })
    
            //Weapon
            $("#ba-student-weapon-name").text(student[`weapon_name_${userLang}`] ? student[`weapon_name_${userLang}`]: student.weapon_name_ja)
            $("#ba-student-weapon-type").text(student.weapon_type)
            $("#ba-student-weapon-img").attr("src", `images/weapon/Weapon_Icon_${student.id}.png`)
    
            if (student[`weapon_skill_passive_description_${userLang}`] != null) {
                $("#ba-weapon-skill-passive-name").text(student[`skill_passive_name_${userLang}`] ? student[`skill_passive_name_${userLang}`] + data.localization.strings["skill_plus"][userLang] : student.skill_passive_name_ja + '＋')
                $('#ba-weapon-skill-passive-icon').attr("src", "images/skill/" + student.skill_passive_icon)
                recalculateWeaponSkillPreview()
            }
    
            $('#ba-weapon-bonus-terrain-type').attr("src", `images/ui/Terrain_${student.weapon_bonus_terrain_type}.png`)
            $('#ba-weapon-bonus-terrain-adaption').attr("src", `images/ui/Ingame_Emo_Adaptresult${student.weapon_bonus_terrain_adaption}.png`)
            $('#ba-weapon-bonus-terrain-adaption-description').html(`${student.weapon_bonus_terrain_type.charAt(0).toUpperCase()+student.weapon_bonus_terrain_type.substr(1)} Combat Power ${eval('student.'+student.weapon_bonus_terrain_type+'_adaption')} → <b>${student.weapon_bonus_terrain_adaption}</b><br>(${getAdaptionText(student.weapon_bonus_terrain_type, student.weapon_bonus_terrain_adaption)})`)
    
            var url = new URL(window.location.href)
    
            if (url.searchParams.get("chara") !== student.name_dev) {
                url.searchParams.forEach((v,k) => url.searchParams.delete(k))
                url.searchParams.set("chara", student.name_dev)
                history.pushState(null, '', url)
            }
            
            $.each(student.weapon_bonus_stats, function(i, el) {
                $(`#ba-weapon-stat-${i+1}`).text(getStatName(student.weapon_bonus_stats[i]))
                $(`#ba-weapon-stat-${i+1}-amount`).text(student.weapon_bonus_stats_parameters[i][0])
            }) 
    
            if (student.weapon_bonus_stats.length > 2) {
                $('#ba-weapon-stat-row2').show()
            } else {
                $('#ba-weapon-stat-row2').hide()
            }
    
            if (student.weapon_description_en) {
                $('#ba-weapon-description').text(student.weapon_description_en)
            } else if (student.weapon_description_ja) {
                $('#ba-weapon-description').text(student.weapon_description_ja)
            } else {
                $('#ba-weapon-description').text("")
            }       
    
            //Profile
            $('#ba-student-fullname').text(student[`fullname_${userLang}`])
            // $("#ba-profile-school-img").attr("src", "images/schoolicon/School_Icon_" + student.school.toUpperCase().replace(" ","") + ".png")
            // $("#ba-profile-school-img-w").attr("src", "images/schoolicon/School_Icon_" + student.school.toUpperCase().replace(" ","") + "_W.png")
            $('#ba-profile-school-label').text(data.localization.strings[`school_${student.school.toLowerCase()}_long`][userLang])
            $('#ba-profile-club-label').text(student[`club_${userLang}`])
            student[`year_${userLang}`] == "" ? $('#ba-profile-schoolyear-label').hide() : $('#ba-profile-schoolyear-label').show()
            $('#ba-profile-schoolyear-label').text(student[`year_${userLang}`])
            $('#ba-profile-portrait-img').attr("src", `images/student/collection/Student_Portrait_${student.name_dev}_Collection.png`)
            $('#ba-student-profile-text').text(student[`profile_${userLang}`] ? student[`profile_${userLang}`] : student[`profile_ja`])
    
            if (student.recollection_lobby) {
                $(".ba-student-lobby").show()
                $("#ba-student-lobby-img").attr("src", `images/student/lobby/Lobbyillust_Icon_${student.name_dev}_01.png`)
                $("#ba-student-lobby-unlock").text(student.recollection_lobby)
                $(".ba-student-lobby").tooltip('dispose').tooltip({title: getRichTooltip(null, `${student['name_'+userLang]}'s Recollection Lobby`, null, null, `Unlocks after reaching relationship rank ${student.recollection_lobby} with ${student['name_'+userLang]}.`), placement: 'top', html: true})
            } else {
                $(".ba-student-lobby").hide()
            }
            
            $('#ba-student-profile-age').text(student.age)
            $('#ba-student-profile-birthday').text(student.birthday)
            $('#ba-student-profile-hobbies').text(student[`hobbies_${userLang}`])
            $('#ba-student-profile-height').text(student.height)
            $('#ba-student-profile-cv').text(student[`cv_${userLang}`])
            $('#ba-student-profile-illustrator').text(student.illustrator)
    
            var favItemsHtml = ""
            $(student.favoured_items[0]).each(function(i,el){
                favItemsHtml += getFavourIconHTML(el, 3)
            })
            $(student.favoured_items[1]).each(function(i,el){
                favItemsHtml += getFavourIconHTML(el, 2)
            })
            $('#ba-student-favoured-items').empty().html(favItemsHtml)
            if (favItemsHtml == "") {
                $('#ba-student-favoured-items').empty().html('<span class="pb-2 text-center">This student does not have any favourite gifts.</span>')
            } else {
                $('#ba-student-favoured-items').empty().html(favItemsHtml)
            }
    
            var favFurnitureHtml = ""
            $(student.favoured_furniture).each(function(i,el){
                favFurnitureHtml += getFurnitureIconHTML(el)
            })
    
            $('#ba-student-favoured-furniture').empty().html(favFurnitureHtml)
            if (favFurnitureHtml == "") {
                $('#ba-student-favoured-furniture').empty().html('<span class="pb-2 text-center">This student does not interact with any café furniture.</span>')
            } else {
                $('#ba-student-favoured-furniture').empty().html(favFurnitureHtml)
            }
            $('.ba-favor-item').tooltip({html: true})
    
            $('#ba-student-bond-1').text(getStatName(student.bond_stat[0]))
            $('#ba-student-bond-2').text(getStatName(student.bond_stat[1]))
    
            if (student.type == "Striker") {
                $('#ba-student-stat-table').removeClass("table-striker-bonus")
                $('#ba-student-stat-striker-bonus').hide()
            } else {
                $('#ba-student-stat-striker-bonus').show()
            }
            
            $('#ba-statpreview-bond-targets').empty().html(getBondTargetsHTML(1, student))
            student_bondalts = []
            for (let i = 0; i < student.bond_extratarget.length; i++) {
                var extraTarget = find(data.students,"id",student.bond_extratarget[i])[0]
                if (extraTarget.released[regionID]) {
                    student_bondalts.push(extraTarget)
                    $('#ba-statpreview-bond-targets').append(getBondTargetsHTML(1 + student_bondalts.length, extraTarget))
                }
            }
    
            document.title = `Schale DB | ${student['name_'+userLang]}`
    
            changeStatPreviewStars(student.stars)
            recalculateWeaponPreview()
            recalculateStatPreview()
            recalculateSkillPreview()
            recalculateEXSkillPreview()
            recalculateBondPreview()
    
            changeGearLevel(1, document.getElementById('ba-statpreview-gear1-range'))
            changeGearLevel(2, document.getElementById('ba-statpreview-gear2-range'))
            changeGearLevel(3, document.getElementById('ba-statpreview-gear3-range'))
    
            for (let i = 1; i <= student_bondalts.length+1; i++) {
                changeStatPreviewBondLevel(i, document.getElementById(`ba-statpreview-bond-${i}-range`))
            }
            //changeStatPreviewWeaponLevel(document.getElementById(`ba-statpreview-weapon-range`))
            
            localStorage.setItem("chara", student.name_dev)
            studentSelectorModal.hide()
        }
    } else {
        loadModule('students', studentName)
    }
    
}

function loadItem(id) {
    if (loadedModule == 'items') {
        var mode = '', item
        if (id >= 1000000) {
            mode = 'furniture'
            item = find(data.common.furniture, "id", id-1000000)[0]
        } else {
            mode = 'items'
            item = find(data.common.items, "id", id)[0]
        } 
        loadedItem = item
        $('#ba-item-name').html(item[`name_${userLang}`])
        $('#ba-item-type').html(mode == 'items' ? item[`type`] : item[`type`] + ' ' + item[`category`])
        $('#ba-item-rarity').html(getRarityTier(item.rarity))
        $('#ba-item-icon').removeClass('ba-item-n ba-item-r ba-item-sr ba-item-ssr').addClass('ba-item-'+item.rarity.toLowerCase())
        $('#ba-item-icon-img').attr('src', `images/${mode}/${item.icon}.png`)
        $('#ba-item-description').html(item[`description_${userLang}`])
        $('#ba-item-usage').empty()
        $('#ba-item-sources').empty().hide()
        if (item.type == 'Material') {
            $('#ba-item-usage').html(getUsedByStudents(item))
            $('.ba-item-student').tooltip({html: true})
            $('#ba-item-sources').html(getItemDropStages(item)).show()
            $('#ba-item-list-tab-materials').tab('show')
        } else if (item.type == 'Gift') {
            $('#ba-item-usage').html(getLikedByStudents(item))
            $('.ba-item-student').tooltip({html: true})
            $('#ba-item-list-tab-gifts').tab('show')
        } else if (item.type == 'Eleph') {
            $('#ba-item-sources').html(getItemDropStages(item)).show()
            let chara = find(data.students, 'id', item.id)[0]
            $('#ba-item-usage').html(`<div class="mb-2"><i>Used by the following students:</i></div><div class="d-flex align-items-center justify-content-center flex-wrap"><div class="ba-item ba-item-student drop-shadow d-inline-block" style="position: relative; cursor: pointer;" data-bs-toggle="tooltip" data-bs-placement="top" onclick="loadStudent('${chara['name_dev']}')" title="${getRichTooltip(`images/student/collection/Student_Portrait_${chara['name_dev']}_Collection.png`, chara[`name_${userLang}`], 'Character', getRarityStars(chara.stars), chara[`profile_${userLang}`] ? chara[`profile_${userLang}`].split('\n')[0] : chara['profile_ja'].split('\n')[0], 50, 'circle')}"><img class="ba-item-icon m-0 mx-1" src="images/student/collection/Student_Portrait_${chara['name_dev']}_Collection.png"></div></div>`)
            $('.ba-item-student').tooltip({html: true})
            $('#ba-item-list-tab-eleph').tab('show')
        }
        if (mode == 'furniture') {
            $('#ba-item-usage').html(`<i>Comfort: ${item.comfort}</i>`)
            $('#ba-item-list-tab-furniture').tab('show') 
        }
        var url = new URL(window.location.href)
        if (url.searchParams.get("item") != id) {
            url.searchParams.forEach((v,k) => url.searchParams.delete(k))
            url.searchParams.set("item", id)
            history.pushState(null, '', url)
        }

        document.title = `Schale DB | ${item['name_'+userLang]}`
        localStorage.setItem("item", id)
    } else {
        loadModule('items', id)
    }
}

function loadRaid(raidName) {
    if (loadedModule == 'raids') {
        raid = find(data.raids,"name_dev",raidName)[0]
        selectedEnemy = 0
        if (raid.released_insane[regionID]) {
            $('#ba-raid-difficulty-5').toggleClass('disabled', false)
        } else {
            $('#ba-raid-difficulty-5').toggleClass('disabled', true)
            if (raid_difficulty == 5)  {
                raid_difficulty = 0
                $('#ba-raid-difficulty-5').toggleClass('active', false)
                $('#ba-raid-difficulty-0').toggleClass('active', true)
            }
        }
    
        $('#ba-raid-affiliation').text(raid.affiliation)
        $('#ba-raid-name').text(raid['name_'+userLang])
    
        $('#ba-raid-header').css('background-image', `url('images/raid/Boss_Portrait_${raid.name_dev}${raid_difficulty == 5 ? "_Insane" : ""}_Lobby.png')`)
        //$('#ba-raid-header-img').attr('src', `images/raid/Boss_Portrait_${raid.name_dev}${difficulty == 5 ? "_Insane" : ""}_Lobby.png`)
    
        if (raid_difficulty == 5) {
            if (raid.attack_type_insane == "Normal") {
                $("#ba-raid-attacktype").removeClass("ba-type-explosive ba-type-mystic ba-type-pierce").addClass("ba-type-normal")
            } else if (raid.attack_type_insane == "Explosive") {
                $("#ba-raid-attacktype").removeClass("ba-type-mystic ba-type-pierce ba-type-normal").addClass("ba-type-explosive")
            } else if (raid.attack_type_insane == "Piercing") {
                $("#ba-raid-attacktype").removeClass("ba-type-mystic ba-type-explosive ba-type-normal").addClass("ba-type-pierce")
            } else if (raid.attack_type_insane == "Mystic") {
                $("#ba-raid-attacktype").removeClass("ba-type-pierce ba-type-explosive ba-type-normal").addClass("ba-type-mystic")
            }
            $("#ba-raid-attacktype-label").text(raid.attack_type_insane)
            $('#ba-raid-attacktype').tooltip('dispose').tooltip({title: getRichTooltip("images/tactical/StrategyObjectBuff_Attack.png", `${raid.attack_type_insane}`, 'Attack Type', getTypeText(raid.attack_type_insane)), placement: 'top', html: true})
        
        } else {
            $("#ba-raid-attacktype").removeClass("ba-type-explosive ba-type-mystic ba-type-pierce").addClass("ba-type-normal")
            $("#ba-raid-attacktype-label").text(raid.attack_type)
            $('#ba-raid-attacktype').tooltip('dispose').tooltip({title: getRichTooltip("images/tactical/StrategyObjectBuff_Attack.png", `${raid.attack_type}`, 'Attack Type', getTypeText(raid.attack_type)), placement: 'top', html: true})    
        }
        var attacktype = (raid_difficulty == 5) ? raid.attack_type_insane : raid.attack_type
        $("#ba-raid-attacktype").removeClass("bg-atk-explosive bg-atk-piercing bg-atk-mystic bg-atk-normal").addClass(`bg-atk-${attacktype.toLowerCase()}`).tooltip('dispose').tooltip({title: getRichTooltip(null, `${attacktype}`, 'Attack Type', null, getTypeText(attacktype), 32), placement: 'top', html: true})
        $("#ba-raid-attacktype-label").text(data.localization.strings[`atk_${attacktype.toLowerCase()}`][userLang])
    
        $("#ba-raid-defensetype").removeClass("bg-def-light bg-def-heavy bg-def-special").addClass(`bg-def-${raid.defense_type.toLowerCase()}`).tooltip('dispose').tooltip({title: getRichTooltip(null, `${raid.defense_type} Armor`, 'Defense Type', null, getTypeText(raid.defense_type), 32), placement: 'top', html: true})
        $("#ba-raid-defensetype-label").text(data.localization.strings[`def_${raid.defense_type.toLowerCase()}`][userLang])
    
        $("#ba-raid-stat-level").text(raid.enemies[selectedEnemy].stats["level"][raid_difficulty].toLocaleString())
        $("#ba-raid-stat-maxhp").text(raid.enemies[selectedEnemy].stats["maxhp"][raid_difficulty].toLocaleString())
        $("#ba-raid-stat-attack").text(raid.enemies[selectedEnemy].stats["attack_power"][raid_difficulty].toLocaleString())
        $("#ba-raid-stat-defense").text(raid.enemies[selectedEnemy].stats["defense_power"][raid_difficulty].toLocaleString())
        $("#ba-raid-stat-critresist").text(raid.enemies[selectedEnemy].stats["crit_res"][raid_difficulty].toLocaleString())
        $("#ba-raid-stat-critdmgresist").text(raid.enemies[selectedEnemy].stats["crit_dmg_res"][raid_difficulty].toLocaleString())
    
    
        var statsHtml = ''
        var tabsHtml = ''
        raid.enemies.forEach(function(el,i) {
            tabsHtml += `<button class="nav-link ${i==0 ? "active" : ""}" data-bs-toggle="tab" href="#ba-raid-enemy-${i}">${el.name_en}</button>`
        })
    
        $('#ba-raid-enemy-tabs').empty().html(tabsHtml)
    
        var skillsHTML = ''
        var skillList = (raid_difficulty == 5) ? raid.skills_insane : raid.skills
        skillList.forEach(function(el, i) {
            skillsHTML += `
            <div class="d-flex flex-row align-items-center mt-2">
                <img class="ba-raid-skill d-inline-block me-3" src="images/raid/skill/${el.icon}.png">
                <div class="d-inline-block">
                    <div>
                        <h4 class="me-2 d-inline">${el.name_en}</h4>
                    </div>
                    <div class="mt-1">
                        <p class="d-inline" style="font-style: italic;">${el.type} Skill</p>
                    </div>
                </div>
            </div>
            <p class="mt-1 mb-2 p-1">${getSkillText(el.description_en, el.parameters, raid_difficulty+1, raid.defense_type)}</p>
            `
            if (i != skillList.length-1) {
                skillsHTML += '<div class="ba-panel-separator"></div>'
            }
        })
        $('#ba-raid-skills').empty().html(skillsHTML)
        $('.ba-skill-debuff, .ba-skill-buff, .ba-skill-special, .ba-skill-cc').each(function(i,el) {
            $(el).tooltip({html: true})
        })
    
        var url = new URL(window.location.href)
    
        if (url.searchParams.get("raid") !== raid.name_dev) {
            url.searchParams.forEach((v,k) => url.searchParams.delete(k))
            url.searchParams.set("raid", raid.name_dev)
            history.pushState(null, '', url)
        }
    
        document.title = `Schale DB | ${raid.name_en}`
        localStorage.setItem("raid", raid.name_dev)
    } else {
        loadModule('raids', raidName)
    }
}

function changeRaidDifficulty(difficultyId) {
    raid_difficulty = difficultyId
    loadRaid(raid.name_dev)
}

function loadStage(id) {
    if (loadedModule == 'stages') {
        var mode = '', item
        if (id >= 3100000) {
            mode = 'commission'
            stage = find(data.stages.commissions, "id", id)[0]
            $('#ba-stage-name').html('Commissions')
        } else if (id >= 3000000) {
            mode = 'bounty'
            stage = find(data.stages.bounty, "id", id)[0]
            $('#ba-stage-name').html('Bounty')
        } else {
            mode = 'mission'
            stage = find(data.stages.missions, "id", id)[0]
            $('#ba-stage-name').html(stage.area+'-'+stage.stage+ (stage.difficulty == 1 ? ' Hard' : ' Normal'))
        } 
        loadedStage = stage
        $('#ba-stage-title').html(stage[`name_${userLang}`])
        $('#ba-stage-level').text('Lv. '+ stage['level_stage'])
        $('#ba-stage-terrain-img').attr('src', `images/ui/Terrain_${stage.terrain}.png`)
        stage.difficulty == 1 ? $('#ba-stage-fog').show() : $('#ba-stage-fog').hide()
        var url = new URL(window.location.href)
        if (url.searchParams.get("stage") != id) {
            url.searchParams.forEach((v,k) => url.searchParams.delete(k))
            url.searchParams.set("stage", id)
            history.pushState(null, '', url)
        }
        var html = ''
        $.each(stage.rewards, function(i,el){
            html += getDropIconHTML(el[0], el[1])
        })
        $.each(stage.drops, function(i,el){
            html += getDropIconHTML(el[0], el[1])
        })
        $('#ba-stage-drops').html(html)
        $('#ba-stage-drops div').each(function(i,el) {
            $(el).tooltip({html: true})
        })
        html = ''
        stage.enemies.sort((a,b) => parseInt(b.toString().slice(b.toString().length-1)) - parseInt(a.toString().slice(a.toString().length-1)))
        $.each(stage.enemies, function(i,el){
            let enemy = find(data.enemies, "id", el)[0]
            if (stage.id >= 3000000) {
                if (enemy.rank == 'Minion') {
                    html += getEnemyCardHTML(enemy, stage.level_enemy[0])
                } else if (enemy.rank == 'Elite') {
                    html += getEnemyCardHTML(enemy, stage.level_enemy[1])
                } else {
                    html += getEnemyCardHTML(enemy, stage.level_enemy[2])
                }
            } else {
                html += getEnemyCardHTML(enemy, stage.level_stage)
            }

            
        })
        $('#ba-stage-enemies').html(html)
        showEnemyInfo(stage.enemies[0], stage.level_stage)
        document.title = `Schale DB | ${stage['name_'+userLang]}`
        localStorage.setItem("stage", id)
    } else {
        loadModule('stages', id)
    }
}

function loadRegion(regID) {
    regionID = regID
    region = data.common.regions[regionID]
    $("#ba-statpreview-levelrange").attr("max",region.studentlevel_max)
    $("#ba-weaponpreview-levelrange").attr("max",region.weaponlevel_max)
    if (region.weaponlevel_max == 0) {
        $("#ba-student-nav-weapon").hide()
        $("#ba-weaponpreview-star-1").hide()
        $("#ba-weaponpreview-star-2").hide()
        $("#ba-weaponpreview-star-3").hide()
        stat_preview_weapon_stars = 0
    }
    $("#ba-bond-levelrange").attr("max",region.bondlevel_max)
    $("#ba-statpreview-gear1-range").attr("max",region.gear1_max)
    $("#ba-statpreview-gear2-range").attr("max",region.gear2_max)
    $("#ba-statpreview-gear3-range").attr("max",region.gear3_max)

    if (regionID == 1) {
        $('#ba-student-search-filter-school-valkyrie').hide()
        $('#ba-student-search-filter-school-srt').hide()
        $('#ba-student-search-filter-school-others').hide()
    }
}

function getAdaptionText(terrain, rank) {
    return `Deals <b>${terrain_dmg_bonus[rank]}&times;</b> damage in <b>${terrain}</b> terrain.\nBlock rate when taking cover <b>+${terrain_block_bonus[rank]}%</b>.\nChance to ignore block when attacking <b>+${terrain_block_bonus[rank]}%</b>.`
}

function getStatName(stat) {
    //return stat_friendlyname[stat]
    return data.localization.strings[`stat_${stat.replace('_percent','')}`][userLang]
}

function getFormattedStatAmount(val) {
    return Number.isInteger(val) ? val : `${parseFloat((val*100).toFixed(2))}%`
}

function changeGearLevel(slot, el) {
    var geartype = eval('student.gear_'+slot)
    var gearobj = find(data.common.gear, "type", geartype)[0]
    $(`#ba-statpreview-gear${slot}-icon`).attr("src", `images/equipment/Equipment_Icon_${geartype}_Tier${el.value}.png`)
    $(`#ba-statpreview-gear${slot}-level`).text(`T${el.value}`)
    $(`#ba-statpreview-gear${slot}-name`).text(`${gearobj.items[el.value-1][`name_${userLang}`]}`)
    var desc = ""
    $(gearobj.items[el.value-1].bonus_stats).each(function(i){
        desc += `${getStatName(gearobj.items[el.value-1].bonus_stats[i])} <b>+${getFormattedStatAmount(gearobj.items[el.value-1].bonus_stats_parameters[i][1])}</b>, `
    })
    $(`#ba-statpreview-gear${slot}-description`).html(desc.substring(0, desc.length-2))
    if ($('#ba-statpreview-includegear').prop('checked')) {
        recalculateStatPreview()
        updateGearIcon()
    }
}

function getGearStatsText(item) {
    var text = "\n\n<b>Bonus Stats:</b>\n"
    $(item.bonus_stats).each(function(i){
        text += `${getStatName(item.bonus_stats[i])} +${getFormattedStatAmount(item.bonus_stats_parameters[i][1])}\n`
    })
    return text
}

function toggleStrikerBonus(el) {
    $('#ba-student-stat-table').toggleClass("table-striker-bonus", $(el).prop('checked'))
    recalculateStatPreview()
}

function changeStatPreviewLevel(el) {
    $('#ba-statpreview-level').text("Lv." + el.value)
    recalculateStatPreview()
}

function changeSkillPreviewLevel(el) {
    if (el.value == el.max) {
        $('#ba-skill-level').html(`<img src="images/ui/ImageFont_Max.png" style="height: 18px;width: auto;margin-top: -2px;">`)
    } else {
        $('#ba-skill-level').html("Lv." + el.value)
    }
    recalculateSkillPreview()
}

function changeWeaponSkillPreviewLevel(el) {
    if (el.value == el.max) {
        $('#ba-weapon-skill-level').html(`<img src="images/ui/ImageFont_Max.png" style="height: 18px;width: auto;margin-top: -2px;">`)
    } else {
        $('#ba-weapon-skill-level').html("Lv." + el.value)
    }
    recalculateWeaponSkillPreview()
}

function changeEXSkillPreviewLevel(el) {
    if (el.value == el.max) {
        $('#ba-skill-ex-level').html(`<img src="images/ui/ImageFont_Max.png" style="height: 18px;width: auto;margin-top: -2px;">`)
    } else {
        $('#ba-skill-ex-level').html("Lv." + el.value)
    }
    recalculateEXSkillPreview()
}

function changeWeaponPreviewLevel(el) {
    var imgHTML = '<img src="images/ui/Common_Icon_Formation_Star_2.png" style="height: 16px;width: auto;margin-top: -3px;"></img>'
    $('#ba-weaponpreview-level').text("Lv." + el.value)
    // if (el.value <= 30) {
    //     $('#ba-weaponpreview-level').append(imgHTML.repeat(1))
    // } else if (el.value <= 40) {
    //     $('#ba-weaponpreview-level').append(imgHTML.repeat(2))
    // } else if (el.value <= 50) {
    //     $('#ba-weaponpreview-level').append(imgHTML.repeat(3))
    // }
    recalculateWeaponPreview()
}

function changeStatPreviewBondLevel(i, el) {
    var imgHTML = '<img src="images/ui/School_Icon_Schedule_Favor.png" style="height:24px; width:auto; margin-top: -3px; margin-left: -2px;">'
    $(`#ba-statpreview-bond-${i}-level`).html(imgHTML + el.value)
    var bondStats
    if (i == 1) {
        bondStats = Object.entries(getBondStats(student, el.value))
    } else {
        bondStats = Object.entries(getBondStats(student_bondalts[i-2], el.value))
    }
    $(`#ba-statpreview-bond-${i}-description`).html(`${getStatName(bondStats[0][0])} <b>+${getFormattedStatAmount(bondStats[0][1])}</b>, ${getStatName(bondStats[1][0])} <b>+${getFormattedStatAmount(bondStats[1][1])}</b>`)
    if ($('#ba-statpreview-includebond').prop('checked')) {
        recalculateStatPreview()
    }
}

function changeStatPreviewWeaponLevel(el) {
    var levelscale = ((((el.value*10) + 20)-1)/99).toFixed(4)
    $(`#ba-statpreview-weapon-description`).empty()
    $.each(student.weapon_bonus_stats, function(i, el) {
        $(`#ba-statpreview-weapon-description`).append(stat_friendlyname[el] + ' <b>+' + Math.round(student.weapon_bonus_stats_parameters[i][0] + (student.weapon_bonus_stats_parameters[i][1]-student.weapon_bonus_stats_parameters[i][0]) * levelscale) + '</b>')
        if (i+1 != student.weapon_bonus_stats.length) {
            $(`#ba-statpreview-weapon-description`).append(', ')
        }
    }) 

    $('#ba-statpreview-weapon-description').text()
    $('#ba-statpreview-weapon-level').html(`<img src="images/ui/Common_Icon_Formation_Star_2.png" style="height: 20px;width: auto;margin-top: -3px;margin-right:2px;"></img>${el.value}`)
    if (stat_preview_weapon_stars > 0) {
        recalculateStatPreview()
    }
}

function getBondTargetsHTML(num, student) {
    return `<div class="mt-2 mb-1 d-flex flex-row align-items-center">
        <div class="me-2" style="position: relative;">
            <img class="ba-bond-icon ms-0" src="images/student/collection/Student_Portrait_${student.name_dev}_Collection.png">
        </div>
        <div class="flex-fill">
            <h5 class="d-inline">${student['name_'+userLang]}</h5>
            <p id="ba-statpreview-bond-${num}-description" class="mb-0" style="font-size: 0.875rem; line-height: 1rem;"></p>
        </div>
    </div>
    <div class="d-flex flex-row align-items-center mb-2">
        <input id="ba-statpreview-bond-${num}-range" oninput="changeStatPreviewBondLevel(${num}, this)" type="range" class="form-range me-2 flex-fill" value="${num == 1 ? 20 : 1}" min="1" max="${region.bondlevel_max}">
        <span id="ba-statpreview-bond-${num}-level" class="ba-slider-label"></span>
    </div>`
}

function changeBondLevel(el) {
    var imgHTML = '<img src="images/ui/School_Icon_Schedule_Favor.png" style="height:24px; width:auto; margin-top: -3px; margin-left: -2px;">'
    $('#ba-bond-level').html(imgHTML + el.value)
    recalculateBondPreview()
}

function updateGearIcon() {
    var gear, tier, includeGear
    includeGear = $('#ba-statpreview-includegear').prop('checked')
    for (let i=1; i<=3; i++) {
        tier = includeGear ? $(`#ba-statpreview-gear${i}-range`).val() : 1
        gear = find(data.common.gear, "type", student[`gear_${i}`])[0]
        $("#ba-student-gear-"+i).attr("src", `images/equipment/Equipment_Icon_${gear.type}_Tier${tier}.png`).tooltip('dispose').tooltip({title: getRichTooltip(`images/equipment/Equipment_Icon_${gear.type}_Tier${tier}.png`, gear.items[tier-1][`name_${userLang}`], gear[`name_${userLang}`], `T${tier}`, gear.items[tier-1][`description_${userLang}`] + getGearStatsText(gear.items[tier-1]), 50, 'img-scale-larger'), placement: 'top', html: true}).toggleClass("gear-disabled", !includeGear)
    }
}

function recalculateTerrainAffinity() {
    var adaption = {}
    adaption["urban"] = student.urban_adaption
    adaption["outdoor"] = student.outdoor_adaption
    adaption["indoor"] = student.indoor_adaption

    if (stat_preview_stars == 5 && stat_preview_weapon_stars >= 3) {
        adaption[student.weapon_bonus_terrain_type] = student.weapon_bonus_terrain_adaption
    }

    $("#ba-student-terrain-urban-icon").attr("src", "images/ui/Ingame_Emo_Adaptresult" + adaption["urban"] + ".png")
    $("#ba-student-terrain-outdoor-icon").attr("src", "images/ui/Ingame_Emo_Adaptresult" + adaption["outdoor"] + ".png")
    $("#ba-student-terrain-indoor-icon").attr("src", "images/ui/Ingame_Emo_Adaptresult" + adaption["indoor"] + ".png")
    $('#ba-student-terrain-urban').tooltip('dispose').tooltip({title: getRichTooltip("images/ui/Ingame_Emo_Adaptresult" + adaption["urban"] + ".png", 'Combat Power ' + adaption["urban"], null, null, getAdaptionText('urban', adaption["urban"]), 30), placement: 'top', html: true})
    $('#ba-student-terrain-outdoor').tooltip('dispose').tooltip({title: getRichTooltip("images/ui/Ingame_Emo_Adaptresult" + adaption["outdoor"] + ".png", 'Combat Power ' + adaption["outdoor"], null, null, getAdaptionText('outdoor', adaption["outdoor"]), 30), placement: 'top', html: true})
    $('#ba-student-terrain-indoor').tooltip('dispose').tooltip({title: getRichTooltip("images/ui/Ingame_Emo_Adaptresult" + adaption["indoor"] + ".png", 'Combat Power ' + adaption["indoor"], null, null, getAdaptionText('indoor', adaption["indoor"]), 30), placement: 'top', html: true})
}

function recalculateWeaponPreview() {

    var level = $("#ba-weaponpreview-levelrange").val()

    var levelscale = ((level-1)/99).toFixed(4)

    $.each(student.weapon_bonus_stats, function(i, el) {
        $(`#ba-weapon-stat-${i+1}-amount`).text('+'+Math.round(student.weapon_bonus_stats_parameters[i][0] + (student.weapon_bonus_stats_parameters[i][1]-student.weapon_bonus_stats_parameters[i][0]) * levelscale))
    }) 

}

function recalculateStatPreview() {

    var minlevelreq = [0, 15, 35]
    var maxbond = [10, 10, 20, 20, 50]
    var strikerBonus = $('#ba-student-stat-table').hasClass("table-striker-bonus")

    var bonus = {
        "maxhp_percent": 1,
        "attack_power_percent": 1,
        "heal_power_percent": 1,
        "maxhp": 0,
        "attack_power": 0,
        "defense_power": 0,
        "heal_power": 0,
        "accuracy": 0,
        "critical": 0,
        "critical_damage": 0,
        "healing_received": 0,
        "cc_power_percent": 1,
        "cc_resist_percent": 1,
        "critical_resist": 0,
        "critical_damage_resist": 0
    }

    var level = $("#ba-statpreview-levelrange").val()
    var levelscale = ((level-1)/99).toFixed(4)

    var maxHP = Math.ceil((Math.round((student.maxhp_1 + (student.maxhp_100-student.maxhp_1) * levelscale).toFixed(4)) * starscale_hp[stat_preview_stars-1]).toFixed(4))
    var attack = Math.ceil((Math.round((student.attack_power_1 + (student.attack_power_100-student.attack_power_1) * levelscale).toFixed(4)) * starscale_attack[stat_preview_stars-1]).toFixed(4))
    var defense = Math.round((student.defense_power_1 + (student.defense_power_100-student.defense_power_1) * levelscale).toFixed(4))
    var healing = Math.ceil((Math.round((student.heal_power_1 + (student.heal_power_100-student.heal_power_1) * levelscale).toFixed(4)) * starscale_healing[stat_preview_stars-1]).toFixed(4))

    if ($('#ba-statpreview-includegear').prop('checked')) {
        var gear = []
        var tier = 1

        gear[0] = find(data.common.gear,"type",student.gear_1)[0]
        gear[1] = find(data.common.gear,"type",student.gear_2)[0]
        gear[2] = find(data.common.gear,"type",student.gear_3)[0]

        $.each(gear, function(i, el) {
            tier = $(`#ba-statpreview-gear${i+1}-range`).val()
            if (level >= minlevelreq[i]) {
                for (let j = 0; j < el.items[tier-1].bonus_stats.length; j++) {
                    bonus[el.items[tier-1].bonus_stats[j]] += el.items[tier-1].bonus_stats_parameters[j][1]    
                }
            }
        })
    }

    if ($('#ba-statpreview-includebond').prop('checked')) {
        for (let i = 1; i <= student_bondalts.length+1; i++) {
            var bondlevel = $(`#ba-statpreview-bond-${i}-range`).val()
            var bondbonus = getBondStats(i == 1 ? student : student_bondalts[i-2], i == 1 ? Math.min(maxbond[stat_preview_stars-1], bondlevel) : bondlevel)
            $.each(bondbonus, function(j, el) {bonus[j] += el})
        }
    }

    if ((stat_preview_stars == 5) && (stat_preview_weapon_stars > 0)) {
        var weaponlevel = (stat_preview_weapon_stars*10) + 20
        var weaponlevelscale = ((weaponlevel-1)/99).toFixed(4)
        $.each(student.weapon_bonus_stats, function(i, el) {
            bonus[student.weapon_bonus_stats[i]] += Math.round((student.weapon_bonus_stats_parameters[i][0] + (student.weapon_bonus_stats_parameters[i][1]-student.weapon_bonus_stats_parameters[i][0]) * weaponlevelscale).toFixed(4))
        }) 
    }

    if (!strikerBonus) {
        $('#ba-student-stat-maxhp').text(Math.round(((maxHP+bonus["maxhp"])*bonus["maxhp_percent"]).toFixed(4)).toLocaleString())
        $('#ba-student-stat-attack').text(Math.round(((attack+bonus["attack_power"])*bonus["attack_power_percent"]).toFixed(4)).toLocaleString())
        $('#ba-student-stat-defense').text((defense+bonus["defense_power"]).toLocaleString())
        $('#ba-student-stat-healing').text(Math.round(((healing+bonus["heal_power"])*bonus["heal_power_percent"]).toFixed(4)).toLocaleString())
    } else {
        $('#ba-student-stat-maxhp').text('+'+Math.floor(((maxHP+bonus["maxhp"])*bonus["maxhp_percent"]).toFixed(4)*0.1).toLocaleString())
        $('#ba-student-stat-attack').text('+'+Math.floor(((attack+bonus["attack_power"])*bonus["attack_power_percent"]).toFixed(4)*0.1).toLocaleString())
        $('#ba-student-stat-defense').text('+'+Math.floor((defense+bonus["defense_power"])*0.05).toLocaleString())
        $('#ba-student-stat-healing').text('+'+Math.floor(((healing+bonus["heal_power"])*bonus["heal_power_percent"]).toFixed(4)*0.05).toLocaleString())
    }

    $('#ba-student-stat-accuracy').text((student.accuracy+bonus["accuracy"]).toLocaleString())
    $('#ba-student-stat-evasion').text(student.evasion.toLocaleString())
    var totalcrit = student.critical+bonus["critical"]-100
    $('#ba-student-stat-crit').text((student.critical+bonus["critical"]).toLocaleString())//.tooltip('dispose').tooltip({title: `<b>${parseFloat(((totalcrit/(totalcrit+650))*100).toFixed(2))}%</b> critical chance against a target with 100 crit resistance.`, placement: 'top', html: true})
    $('#ba-student-stat-critdmg').text(`${parseFloat(((student.critical_dmg+bonus["critical_damage"])/100).toFixed(4)).toLocaleString()}%`)

    $('#ba-student-stat-stability').text(student.stability.toLocaleString()).tooltip('dispose')//.tooltip({title: getRichTooltip(null, 'Damage Variance', null, `<b>${parseFloat((((student.stability/(student.stability+997))+0.2)*100).toFixed(2))}%</b> ~ 100%`), placement: 'top', html: true})
    $('#ba-student-stat-range').text(student.range.toLocaleString())
    $('#ba-student-stat-ccpower').text(`${Math.round(((100*bonus["cc_power_percent"])).toFixed(4)).toLocaleString()}`)
    $('#ba-student-stat-ccresist').text(`${Math.round(((100*bonus["cc_resist_percent"])).toFixed(4)).toLocaleString()}`)

    if (student.type == "Striker") {
        $('#ba-student-stat-ammo').text(student.ammo_count + " (" + student.ammo_cost + ")")
    } else {
        $('#ba-student-stat-ammo').text('N/A')
    }
    
    //$('#ba-student-stat-costrecovery').text(student.cost_recovery)
    $('#ba-student-stat-critresist').text(100+bonus["critical_resist"])
    $('#ba-student-stat-critdmgresist').text(`${parseFloat(((5000+bonus["critical_damage_resist"])/100).toFixed(4))}%`)
    $('#ba-student-stat-recoveryrate').text(`${parseFloat(((10000+bonus["healing_received"])/100).toFixed(4))}%`)
}

function recalculateEXSkillPreview() {
    var skillLevelEX = $("#ba-skillpreview-exrange").val()

    $('#ba-skill-ex-description').html(getSkillText(student[`skill_ex_description_${userLang}`] ? student[`skill_ex_description_${userLang}`] : student[`skill_ex_description_en`], student[`skill_ex_parameters_${userLang}`] ? student[`skill_ex_parameters_${userLang}`] : student['skill_ex_parameters'], skillLevelEX, student.attack_type))
    $('.ba-skill-debuff, .ba-skill-buff, .ba-skill-special, .ba-skill-cc').each(function(i,el) {
        $(el).tooltip({html: true})
    })

    $('.ba-skill-ex-materials').hide()
    $('#ba-skill-ex-materials-'+skillLevelEX).show()
    $('#ba-skill-ex-cost').text(student.skill_ex_cost[skillLevelEX-1])

}

function recalculateSkillPreview() {
    var skillLevel = $("#ba-skillpreview-range").val()

    $('#ba-skill-normal-description').html(getSkillText(student[`skill_normal_description_${userLang}`] ? student[`skill_normal_description_${userLang}`] : student[`skill_normal_description_en`], student.skill_normal_parameters, skillLevel, student.attack_type))
    $('#ba-skill-passive-description').html(getSkillText(student[`skill_passive_description_${userLang}`] ? student[`skill_passive_description_${userLang}`] : student[`skill_passive_description_en`], student.skill_passive_parameters, skillLevel, student.attack_type))
    $('#ba-skill-sub-description').html(getSkillText(student[`skill_sub_description_${userLang}`] ? student[`skill_sub_description_${userLang}`] : student[`skill_sub_description_en`], student.skill_sub_parameters, skillLevel, student.attack_type))
    $('.ba-skill-debuff, .ba-skill-buff, .ba-skill-special, .ba-skill-cc').each(function(i,el) {
        $(el).tooltip({html: true})
    })

    $('.ba-skill-materials').hide()
    $('#ba-skill-materials-'+skillLevel).show()
}

function getStudentListCardHTML(student) {
    var html = `
    <div id="ba-student-select-${student["id"]}" class="ba-student-select-item unselectable">
        <div onclick="loadStudent('${student["name_dev"]}')" class="ba-student-card">
            <div class="ba-student-card-portrait"><img class="ba-student-card-portrait-img" src="images/student/collection/Student_Portrait_${student["name_dev"]}_Collection.png"></div>
            <span class="ba-student-card-role bg-${student["type"].toLowerCase()}-t"><img src="images/ui/Role_${student["role"]}.png" style="width:100%"></span>
            <span class="ba-student-card-atk bg-atk-${student["attack_type"].toLowerCase()}-t"><img src="images/ui/Type_Attack_s.png" style="width:100%;"></span>
            <span class="ba-student-card-def bg-def-${student["defense_type"].toLowerCase()}-t"><img src="images/ui/Type_Defense_s.png" style="width:100%;"></span>
            <img class="ba-student-card-star" style="right: 2px; top: 2px;" src="images/ui/Common_Icon_Formation_Star_R${student["stars"]}.png">
            <div class="d-flex align-items-center ba-student-card-label">
                <span class="ba-label-text px-1 align-middle ${student['name_'+userLang].length > label_smalltext_threshold[userLang] ? "smalltext" : ""}" style="width: 100%">${student['name_'+userLang].replace(' (','\n(')}</span>
                <span class="ba-hover-text px-1 align-middle ${student['name_'+userLang].length > label_smalltext_threshold[userLang] ? "smalltext" : ""}" style="display: none; width: 100%">${student['name_'+userLang].replace(' (','\n(')}</span>
            </div>
        </div>
    </div>`
    //html += `<span class="px-1 align-middle ${label.length > 11 ? "smalltext" : ""}" style="width: 100%">${label.replace(' (','\n(')}</span>`
    return html
}

function getStageCardHTML(stage) {
    var html = `<div id="ba-stage-select-${stage["id"]}" class="ba-stage-select-item unselectable">
    <div onclick="loadStage('${stage["id"]}')" class="ba-stage-card">
    <div class="ba-stage-card-img"><img src="images/campaign/${stage["icon"]}.png"></div>
    <div class="d-flex align-items-center ba-stage-card-label">`
    if (stage.id >= 3000000) {
        html += `<span class="ba-label-text px-1 align-middle ${stage['name_'+userLang].length > label_smalltext_threshold[userLang] ? "smalltext" : "" }" style="width: 100%">${stage['name_'+userLang]}</span>`
    } else {
        html += `<span class="ba-label-text px-1 align-middle" style="width: 100%">${stage.area+'-'+stage.stage+ (stage.difficulty == 1 ? ' Hard' : ' Normal')}</span>`
    }
    html += `</div></div></div>`
    return html
}

function getEnemyCardHTML(enemy, level) {
    var html = `<div class="ba-icon-enemy unselectable" onclick="showEnemyInfo(${enemy.id},${level})"><img src="images/enemy/${enemy.icon}.png">`
    if (enemy.rank == 'Elite') html += `<span class="ba-enemy-card-rank"><img src="images/ui/Common_Icon_Enemy_Elite.png" style="width:22px;"></span>`
    else if (enemy.rank == 'Champion') html += `<span class="ba-enemy-card-rank"><img src="images/ui/Common_Icon_Enemy_Champion.png" style="width:31px;"></span>`
    html += `<span class="ba-enemy-card-atk bg-atk-${enemy["attack_type"].toLowerCase()}"><img src="images/ui/Type_Attack_s.png" style="width:100%;"></span>
    <span class="ba-enemy-card-def bg-def-${enemy["defense_type"].toLowerCase()}"><img src="images/ui/Type_Defense_s.png" style="width:100%;"></span><div class="d-flex align-items-center ba-stage-card-label"><span class="ba-label-text px-1 align-middle ${enemy['name_'+userLang].length > label_enemy_smalltext_threshold[userLang] ? 'smalltext' : ''}" style="width: 100%">${enemy['name_'+userLang]}</span></div></div>`
    return html
}

function showEnemyInfo(id, level) {
    var enemy = find(data.enemies, 'id', id)[0]
    $('#ba-stage-enemy-name').text(enemy['name_'+userLang])
    $('#ba-stage-enemy-img').attr('src', `images/enemy/${enemy.icon}.png`)
    $('#ba-stage-enemy-rank').text('Lv.'+level + ' ' + enemy.rank)
    $('#ba-stage-enemy-class').text(enemy.type).removeClass("bg-striker bg-special").addClass(`bg-${enemy.type.toLowerCase()}`)

    $("#ba-stage-enemy-attacktype").removeClass("bg-atk-normal bg-atk-explosive bg-atk-piercing bg-atk-mystic").addClass(`bg-atk-${enemy.attack_type.toLowerCase()}`)
    $("#ba-stage-enemy-defensetype").removeClass("bg-def-light bg-def-heavy bg-def-special").addClass(`bg-def-${enemy.defense_type.toLowerCase()}`)
    
    $("#ba-stage-enemy-attacktype-label").text(data.localization.strings[`atk_${enemy.attack_type.toLowerCase()}`][userLang])
    $('#ba-stage-enemy-attacktype').tooltip('dispose').tooltip({title: getRichTooltip(null, `${enemy.attack_type}`, 'Attack Type', null, getTypeText(enemy.attack_type), 32), placement: 'top', html: true})
    $("#ba-stage-enemy-defensetype-label").text(data.localization.strings[`def_${enemy.defense_type.toLowerCase()}`][userLang])
    $('#ba-stage-enemy-defensetype').tooltip('dispose').tooltip({title: getRichTooltip(null, `${enemy.defense_type} Armor`, 'Defense Type', null, getTypeText(enemy.defense_type), 32), placement: 'top', html: true})

    var levelscale = ((level-1)/99).toFixed(4)

    var maxHP = Math.round((enemy.maxhp_1 + (enemy.maxhp_100-enemy.maxhp_1) * levelscale).toFixed(4))
    var attack = Math.round((enemy.attack_power_1 + (enemy.attack_power_100-enemy.attack_power_1) * levelscale).toFixed(4))
    var defense = Math.round((enemy.defense_power_1 + (enemy.defense_power_100-enemy.defense_power_1) * levelscale).toFixed(4))
    var healing = Math.round((enemy.heal_power_1 + (enemy.heal_power_100-enemy.heal_power_1) * levelscale).toFixed(4))

    
    $('#ba-stage-enemy-stat-maxhp').text(maxHP.toLocaleString())
    $('#ba-stage-enemy-stat-attack').text(attack.toLocaleString())
    $('#ba-stage-enemy-stat-defense').text(defense.toLocaleString())
    $('#ba-stage-enemy-stat-healing').text(healing.toLocaleString())


    $('#ba-stage-enemy-stat-accuracy').text(enemy.accuracy.toLocaleString())
    $('#ba-stage-enemy-stat-evasion').text(enemy.evasion.toLocaleString())
    $('#ba-stage-enemy-stat-crit').text(enemy.critical.toLocaleString())
    $('#ba-stage-enemy-stat-critdmg').text(`${parseFloat(((enemy.critical_dmg)/100).toFixed(4)).toLocaleString()}%`)

    $('#ba-stage-enemy-stat-stability').text(enemy.stability.toLocaleString())
    $('#ba-stage-enemy-stat-range').text(enemy.range.toLocaleString())

    if (enemy.type == "Striker") {
        $('#ba-stage-enemy-stat-ammo').text(enemy.ammo_count + " (" + enemy.ammo_cost + ")")
    } else {
        $('#ba-stage-enemy-stat-ammo').text('N/A')
    }

    $('#ba-stage-enemy-stat-critresist').text(enemy.critical_res.toLocaleString())
    $('#ba-stage-enemy-stat-critdmgresist').text(`${parseFloat(((enemy.critical_dmg_res)/100).toFixed(4))}%`)
    $('#ba-stage-enemy-stat-movespeed').text(enemy.move_speed.toLocaleString())

}

function getMaterialIconHTML(id, amount) {
    //rarity, icon, name, amount, type, description=""
    var item = find(data.common.items, "id", id)[0]
    var html
    html = `<div class="drop-shadow" style="position: relative; cursor:pointer;" onclick="loadItem(${item.id})" data-bs-toggle="tooltip" data-bs-placement="top" title="${getRichTooltip(`images/items/${item.icon}.png`, item[`name_${userLang}`], item.type, getRarityTier(item.rarity), item[`description_${userLang}`], 50, 'img-scale-larger')}">
            <img class="ba-item-icon ba-item-${item.rarity.toLowerCase()}" src="images/items/${item.icon}.png"><span class="ba-material-label">&times;${amount}</span></div>
            `
    return html
}

function getDropIconHTML(id, chance) {
    //rarity, icon, name, amount, type, description=""
    var item, type, haslink
    if (id >= 2000000) {
        item = find(data.common.equipment, "id", id-2000000)[0]
        type = 'equipment'
        haslink = false
    } else if (id >= 30000) {
        item = find(data.common.item_box, "id", id)[0]
        type = 'items'
        haslink = false
    } else {
        item = find(data.common.items, "id", id)[0]
        type = 'items'
        haslink = true
    }
    var html
    html = `<div class="drop-shadow" style="position: relative; ${haslink ? 'cursor:pointer;" onclick="loadItem('+item.id+')"' : '"'} data-bs-toggle="tooltip" data-bs-placement="top" title="${getRichTooltip(`images/${type}/${item.icon}.png`, item[`name_${userLang}`], item.type, getRarityTier(item.rarity), item[`description_${userLang}`], 50, 'img-scale-larger')}">
            <img class="ba-item-icon ba-item-${item.rarity.toLowerCase()}" src="images/${type}/${item.icon}.png"><span class="ba-material-label">${chance >= 1 ? '&times;'+chance: parseFloat((chance*100).toFixed(2)) + '&#37;'}</span></div>
            `
    return html
}

function getFavourIconHTML(id, grade) {
    var gift = find(data.common.items, "id", 5000+id)[0]
    var html = `<div class="ba-favor-item drop-shadow" style="position: relative; cursor:pointer;" onclick="loadItem(${gift.id})" data-bs-toggle="tooltip" data-bs-placement="top" title="${getRichTooltip(`images/items/${gift.icon}.png`, gift[`name_${userLang}`], gift.type, getRarityStars(gift.rarity), gift[`description_${userLang}`], 50, 'img-scale-larger')}">
            <img class="ba-item-icon ba-item-${gift.rarity.toLowerCase()}" src="images/items/${gift.icon}.png">
            <img class="ba-favor-label" src="images/ui/Cafe_Interaction_Gift_0${grade}.png"></div>
            `
    return html
}

function getFurnitureIconHTML(id) {
    var item = find(data.common.furniture, "id", id)[0]
    var html = `<div class="ba-favor-item drop-shadow" style="position: relative; cursor:pointer;" onclick="loadItem(${item.id+1000000})" data-bs-toggle="tooltip" data-bs-placement="top" title="${getRichTooltip(`images/furniture/${item.icon}.png`, item[`name_${userLang}`], 'Furniture', getRarityStars(item.rarity), item[`description_${userLang}`], 50, 'img-scale-larger')}">
    <img class="ba-item-icon ba-item-${item.rarity.toLowerCase()} mb-2" src="images/furniture/${item.icon}.png"></div>
    `
return html
}

function recalculateWeaponSkillPreview() {
    var skillLevel = $("#ba-weapon-skillpreview-range").val()
    $('#ba-weapon-skill-passive-description').html(getSkillText(student[`weapon_skill_passive_description_${userLang}`] ? student[`weapon_skill_passive_description_${userLang}`] : student[`weapon_skill_passive_description_en`], student.weapon_skill_passive_parameters, skillLevel, student.attack_type))
    $('.ba-skill-debuff, .ba-skill-buff, .ba-skill-special, .ba-skill-cc').each(function(i,el) {
        $(el).tooltip({html: true})
    })
}

function recalculateBondPreview() {
    var level = $("#ba-bond-levelrange").val()
    var bondbonus = getBondStats(student, level)
    $("#ba-student-bond-1-amount").text('+'+bondbonus[student.bond_stat[0]])
    $("#ba-student-bond-2-amount").text('+'+bondbonus[student.bond_stat[1]])    
}

function getBondStats(student, level) {
    var stat1 = 0, stat2 = 0
    for (let i = 1; i < Math.min(level, 50); i++) {
        if (i < 20) {
            stat1 += student.bond_stat_value[Math.floor(i / 5)][0]
            stat2 += student.bond_stat_value[Math.floor(i / 5)][1]
        } else if (i < 50) {
            stat1 += student.bond_stat_value[2 + Math.floor(i / 10)][0]
            stat2 += student.bond_stat_value[2 + Math.floor(i / 10)][1]
        }
    }
    return {[student.bond_stat[0]]: stat1, [student.bond_stat[1]]: stat2}
}

function changeStatPreviewStars(stars, weaponstars) {
    stat_preview_stars = stars
    stat_preview_weapon_stars = weaponstars

    for (let i = 1; i <= 5; i++) {
        //i <= stars ? $("#ba-statpreview-star-" + i).attr("src", "images/ui/Common_Icon_Formation_Star.png") : $("#ba-statpreview-star-" + i).attr("src", "images/ui/Common_Icon_Formation_Star_Disable.png")
        $("#ba-statpreview-star-" + i).toggleClass("active", i <= stars)
    }

    for (let i = 1; i <= 3; i++) {
        //i <= weaponstars ? $("#ba-weaponpreview-star-" + i).attr("src", "images/ui/Common_Icon_Formation_Star_2.png") : $("#ba-weaponpreview-star-" + i).attr("src", "images/ui/Common_Icon_Formation_Star_Disable.png")
        $("#ba-weaponpreview-star-" + i).toggleClass("active", i <= weaponstars)
    }

    recalculateStatPreview()
    recalculateTerrainAffinity()
}


function populateItemList() {
    html = {"Material":"", "Gift":"", "Eleph":"", "Furniture":"",}
    $.each(data.common.items, function(i,el) {
        if (el.released[regionID])
        html[el.type] += getItemIconHTML(el)
    })
    $.each(data.common.furniture, function(i,el) {
        html['Furniture'] += getFurnitureItemIconHTML(el)
    })
    $('#ba-item-list-materials').html(html['Material'])
    $('#ba-item-list-gifts').html(html['Gift'])
    $('#ba-item-list-eleph').html(html['Eleph'])
    $('#ba-item-list-furniture').html(html['Furniture'])
}

function populateStageList() {
    var html
    html = ''
    $.each(data.stages.missions, function(i,el) {
        if (el.released[regionID])
        html += getStageCardHTML(el)
    })
    $('#ba-stages-list-missions-grid').html(html)
    html = ''
    $.each(data.stages.bounty, function(i,el) {
        if (el.released[regionID])
        html += getStageCardHTML(el)
    })
    $('#ba-stages-list-bounty-grid').html(html)
    html = ''
    $.each(data.stages.commissions, function(i,el) {
        if (el.released[regionID])
        html += getStageCardHTML(el)
    })
    $('#ba-stages-list-commissions-grid').html(html)
}

function populateRaidList(order) {
    var html = ''

    data.raids.forEach(function(el) {
        if (el.released[regionID]) {
            html += `<div class="ba-raid-list-entry my-2 text-shadow" style="background-image: url('images/raid/${el.background_img}.png')" onclick="loadRaid('${el.name_dev}')"><img class="ba-raid-portrait" src="images/raid/${el.portrait_img}.png"><span style="color:#fff;font-size:26px;font-weight:bold;position:absolute;left:10px;top:3px;">${el.name_en}</span></div>`
        }
    })

    $("#ba-raid-list").html(html)
}

function getItemIconHTML(item) {
    var html
    html = `<div class="drop-shadow d-inline-block"><div class="ba-item m-2" style="position: relative; cursor:pointer;" data-bs-toggle="tooltip" data-bs-placement="top" onclick="loadItem(${item.id})"><img class="ba-item-${item.rarity.toLowerCase()}" src="images/items/${item.icon}.png"></div></div>`
    return html
}

function getFurnitureItemIconHTML(item) {
    var html
    html = `<div class="drop-shadow d-inline-block"><div class="ba-item m-2" style="position: relative; cursor:pointer;" data-bs-toggle="tooltip" data-bs-placement="top" onclick="loadItem(${item.id+1000000})"><img class="ba-item-${item.rarity.toLowerCase()}" src="images/furniture/${item.icon}.png"></div></div>`
    return html
}

function getUsedByStudents(item) {
    var html = '<div class="mb-2"><i>Used by the following students:</i></div><div class="d-flex align-items-center justify-content-center flex-wrap">'
    $.each(data.students, function(i,el){
        if (!el.released[regionID])
        return
        let uses = false
        for (let i = 0; i < el.skill_ex_upgrade_material.length; i++) {
            for (let j = 0; j < el.skill_ex_upgrade_material[i].length; j++) {
                if (item.id == el.skill_ex_upgrade_material[i][j]) {
                    uses = true
                    break
                }
            }
            if (uses)
            break
        }
        if (!uses)
        for (let i = 0; i < el.skill_upgrade_material.length; i++) {
            for (let j = 0; j < el.skill_upgrade_material[i].length; j++) {
                if (item.id == el.skill_upgrade_material[i][j]) {
                    uses = true
                    break
                }
            }
            if (uses)
            break
        }
        if (uses)
        html += `<div class="ba-item ba-item-student drop-shadow d-inline-block" style="position: relative; cursor: pointer;" data-bs-toggle="tooltip" data-bs-placement="top" onclick="loadStudent('${el['name_dev']}')" title="${getRichTooltip(`images/student/collection/Student_Portrait_${el['name_dev']}_Collection.png`, el[`name_${userLang}`], 'Character', getRarityStars(el.stars), el[`profile_${userLang}`] ? el[`profile_${userLang}`].split('\n')[0] : el['profile_ja'].split('\n')[0], 50, 'circle')}"><img class="ba-item-icon m-0 mx-1" src="images/student/collection/Student_Portrait_${el['name_dev']}_Collection.png"></div>
        `
    })
    html += "</div>"
    return html
}

function getLikedByStudents(item) {
    var htmlLoves = `<div class="mb-2"><i>Loved by the following students:</i></div><div class="d-flex align-items-center justify-content-center flex-wrap mb-2">`
    var htmlLikes = `<div class="mb-2"><i>Liked by the following students:</i></div><div class="d-flex align-items-center justify-content-center flex-wrap">`
    $.each(data.students, function(i,el){
        if (!el.released[regionID])
        return
        let likes = false, loves = false
        for (let i = 0; i < el.favoured_items[0].length; i++) {
            if (item.id-5000 == el.favoured_items[0][i]) {
                loves = true
                break
            }
        }
        for (let i = 0; i < el.favoured_items[1].length; i++) {
            if (item.id-5000 == el.favoured_items[1][i]) {
                likes = true
                break
            }
        }
        
        let html = `<div class="ba-item ba-item-student drop-shadow d-inline-block" style="position: relative; cursor: pointer;" data-bs-toggle="tooltip" data-bs-placement="top" onclick="loadStudent('${el['name_dev']}')" title="${getRichTooltip(`images/student/collection/Student_Portrait_${el['name_dev']}_Collection.png`, el[`name_${userLang}`], 'Character', getRarityStars(el.stars), el[`profile_${userLang}`] ? el[`profile_${userLang}`].split('\n')[0] : el['profile_ja'].split('\n')[0], 50, 'circle')}"><img class="ba-item-icon m-0 mx-1" src="images/student/collection/Student_Portrait_${el['name_dev']}_Collection.png"></div>
        `
        if (likes) htmlLikes += html
        if (loves) htmlLoves += html
    })
    htmlLikes += "</div>"
    htmlLoves += "</div>"
    return htmlLoves + htmlLikes
}

function getItemDropStages(item) {
    let html = '<div class="d-flex justify-content-center flex-wrap">'
    $.each(data.stages.missions, function(i,el){
        if (!el.released[regionID])
        return
        let drop = false
        for (let i = 0; i < el.drops.length; i++) {
            if (item.id == el.drops[i][0]) {
                drop = true
                break
            }
        }
        if (drop)
        html += '<div class="m-1">' + getStageCardHTML(el) + '</div>'
    })
    html += '</div>'
    return html
}