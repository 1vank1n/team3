// only for ./public/html/jndex.html

$(function () {
    
    // geolocation
    var user_lat, user_long, obCity, obLocality;

    function getUrlParameter(sParam) {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++) 
        {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam) 
            {
                return sParameterName[1];
            }
        }
    }
    
    // Проверяем есть ли геолокация
    function getLocation () {
        console.log('try to getLocation');
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(getPosition);
        } else {
            console.log('error geolocation');
        }
    }

    function getPosition(position) {
        user_lat = position.coords.latitude;
        user_long = position.coords.longitude;
        console.log('location loaded, coords:', user_lat, user_long);
        getCity(user_lat, user_long);
        return;
    }
    
    function getCity(user_lat, user_long) {
        $.getJSON('http://ekb.shri14.ru/api/geocode?coords=' + user_long + ',' + user_lat)
            .done(function(data) {
                obCity = data;
                console.log('obCity:', obCity);
                getLocality(obCity.geoid)
            })
            .fail(function() {
                console.log('error getCity');
            });
    }
    
    function getLocality(geoid) {
        $.getJSON('http://ekb.shri14.ru/api/localities/' + geoid)
            .done(function(data) {
                obLocality = data;
                console.log('obLocality:', data);
                render(obLocality);
                saveLocalityToLocalStorage(obLocality);
            })
            .fail(function() {
                console.log('error getCity');
            });
    }
    
    function renderEngine(obLocality, sourceSelector, targetSelector) {
        var source   = $(sourceSelector).html();
        var template = Handlebars.compile(source);
        var html     = template(obLocality);
        $(targetSelector).html(html);
    }
    
    function render(obLocality) {
        obLocality['localStorage'] = localStorage;
        console.log(obLocality);
        renderEngine(obLocality, '#template-forecast-small__data', '.forecast-small__data');
        renderEngine(obLocality, '#template-forecast-small__options', '.forecast-small__options');
        renderEngine(obLocality, '#template-forecast-shortly', '.forecast__data');
    }


    // 
    // HANDLEBARS.JS HELPERS
    // 
    Handlebars.registerHelper('dayOfWeek', function(date) {
        // date = "2014-11-21"
        return ["вс", "пн", "вт", "ср", "чт", "пт", "сб"][new Date(date).getDay()];
    });

    Handlebars.registerHelper('isWeekend', function(date) {
        // date = "2014-11-21"
        var indexDay = new Date(date).getDay();
        return (indexDay == 6 || indexDay == 0) ? '-weekend' : '';
    });
    
    Handlebars.registerHelper('dayFromDate', function(date) {
        // date = "2014-11-21"
        return date.split('-')[2];
    });

    Handlebars.registerHelper('monthFromDate', function(date) {
        // date = "2014-11-21"
        return ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"][parseInt(date.split('-')[1]) - 1];
    });
    
    Handlebars.registerHelper('slice', function(context, options) {
        var ret = "",
            index = 0,
            offset = parseInt(options.hash.offset);
        
        for(offset; offset<context.length; offset++) {
        
            if (options.data) {
                data = Handlebars.createFrame(options.data || {});
                data.index = index;
                
                if (index == 0) {
                    data.first = true;
                }
            }
            
            ret += options.fn(context[offset], {data:data});
            index++
        }

        return ret;
    });

    // 
    // ACTIONS
    //
    $('body').on('click', 'ul.forecast-shortly__menu > li > a', function(e){
        e.preventDefault();
        var view = $(this).data('view');
        $('ul.forecast-shortly__menu > li > a').removeClass('menu__item-active');

        if (view == 'short') {
            renderEngine(obLocality, '#template-forecast-shortly', '.forecast__data');
            $(this).addClass('menu__item-active');
        }

        if (view == 'full') {
            renderEngine(obLocality, '#template-forecast-full', '.forecast__data');
            $(this).addClass('menu__item-active');
        }

        if (view == 'hours') {
            renderEngine(obLocality, '#template-forecast-hours', '.forecast__data');
            initGraphs([7, 4, 2, 0 -2, -5, 0, 4, 2, -2, -5, -7, -3, 0, 2, 2, 5, 7, 4, 0, -1, -3, -4, -6, 4]);
            $(this).addClass('menu__item-active');
        }
    })



    // 
    // INITIAL
    //

    var geoid = getUrlParameter('geoid')
    if (geoid) {
        getLocality(geoid);
    } else {
        getLocation();
    }
    // getLocality(54); // Екатеринбург по дефолту
});