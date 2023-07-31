
const API_KEY = "de4b71cde4426b63c0f51a1b23f71f2c";

const DAYS_OF_THE_WEEK = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

let selectedCityText;
let selectedCity;

const getCityName = async (city) =>{
    const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=30&appid=${API_KEY}`);
    return response.json();
}

const getCurrentWeatherData = async({lat, lon, name}) =>{
    const url = lat && lon ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric` : `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
    const response = await fetch(url);
    return response.json();
}

const getHourlyForcast = async({name : city}) => {
   const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`);
   const data = await response.json();
//    console.log(data);
   return data.list.map(forcast => {
    const {main:{temp, temp_max, temp_min}, dt, dt_txt, weather:[{description, icon}]} = forcast;
    return{temp, temp_max, temp_min, dt, dt_txt, description, icon};
   });
}

// optional channing to make temp visible only to one decimal place
const formatTemperature = (temp) => `${temp?.toFixed(1)}⁰c`;
const createIconUrl = (icon) => `https://openweathermap.org/img/wn/${icon}@2x.png`;



const loadCurrentForcast = ({name, main:{temp, temp_min, temp_max}, weather: [{description,icon}] }) => {
    const cityName = document.querySelector(".city");
    cityName.innerHTML = name;
    const currentTemp = document.querySelector(".temp");
    let iconNow = document.querySelector(".current-icon");
//We can get result by optional channing to 1 decimal place, or by using toFixed() directly
    // currentTemp.innerHTML = `${temp.toFixed(1)}°c`;
    currentTemp.innerHTML = formatTemperature(temp);
    const weatherDescription = document.querySelector(".description");
    weatherDescription.innerHTML = description;
    const minMaxTemp = document.querySelector(".min-max-temp");
    minMaxTemp.innerHTML =  `Hi = ${temp_max.toFixed(1)}°c / Low = ${temp_min.toFixed(1)}°c`;


    iconNow.innerHTML = `<img id="iconNow" src="${createIconUrl(icon)}" alt="">`
    // console.log(loadCurrentForcast);
    // console.log(`${currentWeather.main.temp}⁰C`);
    // console.log(currentWeather.weather[0].description);
    // console.log(`Hi = ${currentWeather.main.temp_max}⁰C / Low = ${currentWeather.main.temp_min}⁰C`);
}


const loadHourlyForcast = ({main: { temp: tempNow }, weather: [{ icon: iconNow }]}, hourlyForcast) => {
    // console.log(hourlyForcast);
    const timeFormatter = Intl.DateTimeFormat("en", {
        hour12: true, hour: "numeric"
    })


    let datafor12Hours = hourlyForcast.slice(2,14); // 12 entries
    const hourlyContainer = document.querySelector(".hourly-container");
    let innerHTMLString = `<article>
    <h4 class="time">Now</h4>
    <img class="icon" src="${createIconUrl(iconNow)}" alt="icon">
    <p class="hourly-temp">${formatTemperature(tempNow)}</p>
</article>`;

    for(let {temp, icon, dt_txt} of datafor12Hours){
    
        innerHTMLString += `<article>
        <h4 class="time">${timeFormatter.format(new Date(dt_txt))}</h4>
        <img class="icon" src="${createIconUrl(icon)}" alt="icon">
        <p class="hourly-temp">${formatTemperature(temp)}</p>
    </article>`;
    }
    hourlyContainer.innerHTML = innerHTMLString;
}


const calculateDayWiseForcast = (hourlyForcast) => {
    let dayWiseForcast = new Map();
    for(let forcast of hourlyForcast){
        const [date] = forcast.dt_txt.split(" ");
        const daysOfTheWeek = DAYS_OF_THE_WEEK[new Date(date).getDay()];
        console.log(daysOfTheWeek);
        if(dayWiseForcast.has(daysOfTheWeek)){
            let forcastForTheDay = dayWiseForcast.get(daysOfTheWeek);
            forcastForTheDay.push(forcast);
            dayWiseForcast.set(daysOfTheWeek, forcastForTheDay);
        } else {
            dayWiseForcast.set(daysOfTheWeek, [forcast]);
        }
    }
    console.log(dayWiseForcast);
    for(let [key, value] of dayWiseForcast ){
        let temp_min = Math.min(...Array.from(value, val => val.temp_min));
        let temp_max = Math.min(...Array.from(value, val => val.temp_max));
    
        dayWiseForcast.set(key, {temp_min, temp_max, icon: value.find(v => v.icon).icon});
    }
    console.log(dayWiseForcast);
    return dayWiseForcast;
}

const loadFiveDayForcast = (hourlyForcast) => {
    console.log(hourlyForcast);
    const dayWiseForcast = calculateDayWiseForcast(hourlyForcast);
    const container = document.querySelector(".fiveDay-container");
    let dayWiseInfo = "";
    console.log(dayWiseForcast);
    Array.from(dayWiseForcast).map(([day, {temp_max, temp_min, icon}],index) => {

    if(index < 5) {
    dayWiseInfo += ` <article class="day-wise-forcast">
    <h3 class="day">${index === 0? "TODAY" : day}</h3>
    <img class="icon" src="${createIconUrl(icon)}" alt="icon for the forcast" />
    <p class="min-temp">${formatTemperature(temp_min)}</p>
    <p class="max-temp">${formatTemperature(temp_max)}</p>
</article>`; 
    }
});

container.innerHTML = dayWiseInfo;
}


const loadFeelsLike = ({ main : {feels_like} }) => {
    let container = document.querySelector("#feels-like");
    container.querySelector(".feels-like-temp").innerHTML = formatTemperature(feels_like);
}

const loadHumidity = ({ main : {humidity} }) => {
    let humidityFelt = document.querySelector("#humidity");
    humidityFelt.querySelector(".humidity-value").innerHTML = `${humidity}%`;
}

const loadForcastUsingGeoLocation = () => {
    navigator.geolocation.getCurrentPosition(({coords}) => {
        const {latitude:lat, longitude:lon} = coords;
        selectedCity = {lat, lon };
        loadData();
        console.log(coords);
        console.log(selectedCity);
    }, error => console.log(error));
} 

const loadData = async() => {
    const currentWeather = await getCurrentWeatherData(selectedCity);
    console.log(currentWeather);
    loadCurrentForcast(currentWeather);
    const hourlyForcast = await getHourlyForcast(currentWeather);
    loadHourlyForcast(currentWeather, hourlyForcast);
    loadFiveDayForcast(hourlyForcast);
    loadFeelsLike(currentWeather);
    loadHumidity(currentWeather);
}



// Implementing Debouncing function so that API request is not called each time on a
//  a single key press while searching for city. In its place once we finish typing city
//  name and after few seconds our API call is done to search city name which we entered.
function debounce(func){
    let timer;
    return (...args) => {
        clearTimeout(timer); // clear existing timer
        // create a new time till the user is typing
        timer = setTimeout( () => {
            func.apply(this, args)
        }, 500);
    }
}

const onSearchChange = async (event) => {
    let { value } = event.target;

    if(!value) {
        selectedCity = null;
        selectedCityText = "";
    }

    if(value && selectedCityText !== value) {
        const listOfCities = await getCityName(value);
        console.log((listOfCities));
        let options = "";
        for(let {lat, lon, name, state, country} of listOfCities){
        // options += `<option value = "${name}, ${state}, ${country}></option>`
        options += `<option data-city-details = '${JSON.stringify({lat, lon, name})}' value = "${name}, ${state}, ${country}"></option>`
    }
    document.querySelector("#cities").innerHTML = options;
    console.log(listOfCities);
    } 
}

handleCitySelection = (event) => {
    selectedCityText = event.target.value;
    let options = document.querySelectorAll("#cities > option");
    console.log(options);
    if(options?.length) {
        let selectedOption = Array.from(options).find(opt => opt.value === selectedCityText);
        selectedCity = JSON.parse(selectedOption.getAttribute("data-city-details"));
        console.log(selectedCity);
        loadData();
    }
}

const debounceSearch = debounce((event) => onSearchChange(event));



document.addEventListener("DOMContentLoaded", async() => {
    loadForcastUsingGeoLocation();
    const searchInput = document.querySelector("#search");
    searchInput.addEventListener("input", debounceSearch);
    searchInput.addEventListener("change", handleCitySelection);

    //    console.log(await getCurrentWeatherData());
})