/// <reference path="jquery-3.7.0.js" />

const COINS_URL = "https://api.coingecko.com/api/v3/coins/";
const prefix = "x_";
let sumCheck = 0;
let isInfoAvailable = false;
let toggledCoinSymbols = [];
let currencies = [];
let body = document.getElementById("body");
let home = document.getElementById("home");
let aboutUs =document.getElementById("aboutUs");
let liveReports = document.getElementById("liveReports");
let search = document.getElementById("search");
let crypto = document.getElementById("crypto");
let aboutUsView = document.getElementById("aboutUsView");
let liveReportsView = document.getElementById("liveReportsView");
let chartContainer = document.getElementById("chartContainer");
let searchResult = document.getElementById("searchResult");
let myModal = document.getElementById("myModal");
let toggledCoinList = document.getElementById("toggledCoinList");

function getPromiseFromAjax(url) {
  return $.ajax({
    method: "GET",
    url: url
  });
}
$(function () {
  $("#aboutUsView").hide();
  $("#liveReportsView").hide();
  getPromiseFromAjax(COINS_URL)
    .then (coinList => showCoinList(coinList))
    .catch ( ()=> alert("The data is not available"));
});

$("#aboutUs").on("click", () => {
  $("#crypto").hide();
  $("#aboutUsView").show();
  $("#liveReportsView").hide();
});

$("#home").on("click", () => {
  $("#aboutUsView").hide();
  $("#liveReportsView").hide();
  getPromiseFromAjax(COINS_URL)
    .then(coinList => showCoinList(coinList))
    .catch(()=> alert("The data is not available"));
    sumCheck=0;
    toggledCoinSymbols = [];
});

$("#liveReports").on("click", () => {
  $("#crypto").hide();
  $("#aboutUsView").hide();
  $("#liveReportsView").show();
});

function showCoinList(coinList) {
  $("#crypto").show();
  $("#crypto").html("");
  const slicedCoinList = coinList.slice(0, 50);
  for (let i = 0; i < slicedCoinList.length; i++) {
    const coin = slicedCoinList[i];
    const resultId = `${prefix}${coin.id}`;
    const checkId = `${coin.symbol}`;
    if (i % 3 === 0) {
      $("#crypto").append(`<div class="row"></div>`);
    }
    $("#crypto .row:last-child").append(` 
    <div class="col-md-4"> 
        <div class="card">
          <div class="card-body">
            <span class="symbol">${coin.symbol}</span>
            <label class="switch">
              <input id="${checkId}" type="checkbox" onchange="checkedToggle(this, '${coin.symbol}')">
              <span class="slider round"></span>
            </label><br>
            <span class="coinIdPlace">${coin.id}</span><br>
            <button class="btn btn-info collapsible" onclick='load("${coin.id}", "${resultId}")'>More info</button>
            <div class="content">
              <div id="${resultId}"></div>
              <div id="timer${resultId}"></div>
            </div>
          </div>
        </div>
      </div>
    `);
    if ((i + 1) % 3 === 0) {
      $("#crypto").append(`</div>`);
    }
  }
    if (slicedCoinList.length % 3 !== 0) {
      $("#crypto").append(`</div>`);
  }
}

function getInfo(coinId, resultId) {
  $(`#${resultId}`).html("");
  setInfoTimer(resultId);
  getPromiseFromAjax(`https://api.coingecko.com/api/v3/coins/${coinId}`)
    .then(data => {
      $(`#${resultId}`).append(`
        <img src="${data.image.small}">
        <li>${data.market_data.current_price.usd}$</li>
        <li>${data.market_data.current_price.eur}&euro;</li>
        <li>${data.market_data.current_price.ils}&#8362</li>
        <button onclick="closeInfo('${resultId}')">Close</button>
      `);
      save(resultId, data);
      isInfoAvailable = true;
    })
    .catch(e => alert(JSON.stringify(e)));
  isInfoAvailable = false;
}

function save(resultId, data) {
  localStorage.setItem(resultId, JSON.stringify(data));
  setTimeout(() => {
    localStorage.removeItem(resultId);
  }, 120000);
}

function load(coinId, resultId) {
  $(`#${resultId}`).html("");
  const savedData = localStorage.getItem(resultId);
  if (savedData) {
    let data = JSON.parse(savedData);
    $(`#${resultId}`).append(`
      <img src="${data.image.small}">
      <li>${data.market_data.current_price.usd}$</li>
      <li>${data.market_data.current_price.eur}&euro;</li>
      <li>${data.market_data.current_price.ils}&#8362;</li>
      <button class="btn-default" onclick="closeInfo('${resultId}')">Close</button>
    `);
  } else {
    getInfo(coinId, resultId);
  }
}

function closeInfo(resultId) {
  $(`#${resultId}`).html("");
}

$("#search").on("keyup", function () {
  let value = $(this).val().toLowerCase();
  $("#crypto .card").filter(function () {
    $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
  });
});

function checkedToggle(checkId, coinSymbol) {

  const index = toggledCoinSymbols.indexOf(coinSymbol);
    if (checkId.checked) {
      sumCheck++;
      toggledCoinSymbols.push(coinSymbol);  
      getPromiseFromAjax(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coinSymbol.toUpperCase()}&tsyms=USD`)
      .done(function(data) {
        $.each(data, function(key, value) {
          if (!value.USD && checkId.checked)
          {
          alert("No chart data available for the selected currency.");
          checkId.checked = false;
          toggledCoinSymbols.splice(index, 1);
          currencies.splice(index, 1);
          sumCheck--;
          }
      });
    });
    } else {
      sumCheck--;
      toggledCoinSymbols.splice(index, 1);
    }
  
    if (sumCheck > 5) {
      checkId.checked = false;
      toggledCoinSymbols.splice(index, 1);
      $('#myModal').modal('show');
      displayToggledCoinSymbols();
      sumCheck--;
    }
    currencies=[];
    toggledCoinSymbols.forEach(coinSymbol=>{
      currencies.push(coinSymbol.toUpperCase());
    },
    );
    chartRender(currencies);
    }
  
function displayToggledCoinSymbols() {
  $("#toggledCoinList").html("");
  toggledCoinSymbols.forEach((coinSymbol) => {
  $("#toggledCoinList").append(`<li>${coinSymbol} <input type="radio" name="coins" class="cancelToggle" id="${coinSymbol}"></li>`);
  }); 
}

$(document).on("click", "input.cancelToggle", function (e) {
  e.preventDefault();
  const coinSymbol = $(this).attr("id");
  $("#toggledCoinList").empty().append(`<li>${coinSymbol}</li>`);
  $("#changeCoin").on("click", function () {
    const index = currencies.indexOf(coinSymbol.toUpperCase());
    const index1 = toggledCoinSymbols.indexOf(coinSymbol);
      currencies.splice(index, 1);
      toggledCoinSymbols.splice(index1, 1);
      sumCheck--;
    $(`#${coinSymbol}`).prop("checked", false);
    $('#myModal').modal('hide');
  });
});

function setInfoTimer(resultId) {
  let interval = setInterval(() => {
    if (isInfoAvailable) {
      clearInterval(interval);
      $(`#timer${resultId}`).html("");
    } else {
      $(`#timer${resultId}`).html(`
        <div>Wait</div>
        <div class="spinner-border" role="status">
          <span class="sr-only"></span>
        </div>
      `);
    }
  }, 5);
}

function chartRender(currencies) {
  let coinDataPoints = {};
  currencies.forEach((currency) => {
    coinDataPoints[currency] = [];
  });

  let chart;

  $.getJSON(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${currencies}&tsyms=USD`)
    .done(function(data) {
      $.each(data, function(key, value) {
          coinDataPoints[key].push({ x: new Date(), y: value.USD });
    });
      let dataPoints = [];
      currencies.forEach((currency) => {
        dataPoints.push({
          type: "line",
          name: currency,
          showInLegend: true,
          legendText: currency,
          dataPoints: coinDataPoints[currency],
        });
      });

      chart = new CanvasJS.Chart("chartContainer", {
        title: {
          text: `Live Chart of ${currencies} to USD`
        },
        axisX: {
          title: "Time",
        },
        axisY: {
          title: "Coin Value",
          minimum: 0,
        },
        data: dataPoints
      });
      chart.render();
      updateChart();
    })
   
  function updateChart() {
    $.getJSON(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${currencies}&tsyms=USD`)
      .done(function(data) {
        $.each(data, function(key, value) {
            coinDataPoints[key].push({ x: new Date(), y: value.USD });
        });
        chart.render();
        setTimeout(updateChart, 2000);
      }
  )}
}