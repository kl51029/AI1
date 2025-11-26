const apiKey = "b46310d958216948fd69bba908110581";

document.getElementById("btnSzukaj").addEventListener("click", () => {
    let miasto = document.getElementById("miastoInput").value;
    
    if(miasto == "") {
        alert("Wpisz nazwę miasta!");
        return;
    }

    pobierzTeraz(miasto);
    pobierzPrognoze(miasto);
});

function pobierzTeraz(miasto) {
    let url = "https://api.openweathermap.org/data/2.5/weather?q=" + miasto + "&appid=" + apiKey + "&units=metric&lang=pl";
    
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.send();

    xhr.onload = function() {
        if (xhr.status === 200) {
            let data = JSON.parse(xhr.responseText);
            console.log("Otrzymana odpowiedź (Current):", data);

            let html = '<div class="box">';
            html += '<h3>Pogoda teraz w: ' + data.name + '</h3>';
            html += '<p>Temperatura: ' + data.main.temp + ' &deg;C</p>';
            html += '<p>Opis: ' + data.weather[0].description + '</p>';
            html += '<p>Wiatr: ' + data.wind.speed + ' m/s</p>';
            html += '</div>';

            document.getElementById("pogodaTeraz").innerHTML = html;
        } else {
            console.log("Błąd pobierania pogody");
        }
    }
}

function pobierzPrognoze(miasto) {
    let url = `https://api.openweathermap.org/data/2.5/forecast?q=${miasto}&appid=${apiKey}&units=metric&lang=pl`;

    fetch(url)
    .then(response => response.json())
    .then(data => {
        console.log("Otrzymana odpowiedź (Forecast):", data);

        let html = '<div class="box"><h3>Prognoza (najbliższe godziny)</h3>';
        
        for (let i = 0; i < 5; i++) {
            let item = data.list[i];
            html += '<p>Data: ' + item.dt_txt + ' | Temp: ' + item.main.temp + ' &deg;C | ' + item.weather[0].description + '</p>';
        }
        html += '</div>';

        document.getElementById("prognoza").innerHTML = html;
    })
    .catch(error => console.error("Błąd fetcha:", error));
}