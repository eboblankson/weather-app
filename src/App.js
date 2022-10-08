import React from "react";
import logo from "./logo.svg";
import "./App.css";
import "./style.css";
import "./css/bootstrap.css";
import "./css/fontawesome/all.css";
import $ from "jquery";
// import FontAwesomeIcon from "@fortawesome/fontawesome-svg-core";
// import './js/fontawesome/all.min.js'

class App extends React.Component {
  componentDidMount() {
    //Weather definition
    var Weather = function () {};

    Weather.prototype.setDate = function () {
      var d = new Date();
      var n = d.toDateString();
      $("#date").text(n);
    };

    Weather.prototype.getLocation = function () {
      //get location from ip address
      var res = {
        city: "Buenos Aires",
        country: "Argentina",
        countryCode: "AR",
        query: "200.61.38.44",
        regionName: "Buenos Aires F.D.",
        status: "success",
      };
      if (res.status === "success") {
        document.getElementById("location").value =
          res.city + ", " + res.countryCode;
        this.location = res.city + ", " + res.countryCode;
        this.currentWeather();
        this.forecast();
      }
    };

    Weather.prototype.setLocation = function () {
      //set location from input text
      $("#f_locator").on(
        "submit",
        function (e) {
          e.preventDefault();
          this.location = $("#location").val();
          this.currentWeather();
          this.forecast();
          this.loadAnimation();
        }.bind(this)
      );
    };

    Weather.prototype.getWeatherIcon = function (wId, sunrise, sunset) {
      //get weather icon passing returned ID of openweather API. Optional sunrise and sunset time, to determine if is day or night type icon. Return an object with icon name and icon animation properties.
      if (wId) {
        var icon = {};
        icon.name = "na";
        icon.animation = "wi-scale";

        function between(min, max, group, animation) {
          if (wId >= min && wId < max) {
            icon.name = group ? group : "na";
            icon.animation = animation ? animation : "wi-scale";
          }
        }

        between(200, 300, "thunderstorm", "wi-fade");
        between(300, 400, "showers", "wi-moveY");
        between(500, 600, "rain", "wi-moveY");
        between(600, 700, "snow", "wi-moveY");
        between(700, 800, "na", "wi-fade");
        between(801, 900, "cloudy", "wi-moveX");
        between(900, 1000, "na");

        var cond = {
          200: "storm-showers",
          201: "storm-showers",
          202: "thunderstorm",
          500: "rain-mix",
          501: "rain-mix",
          502: "rain",
          511: "sleet",
          520: "rain-mix",
          521: "rain-mix",
          600: "snow",
          611: "sleet",
          701: "fog",
          741: "fog",
          905: "windy",
          906: "hail",
        };

        var neutralCond = {
          711: "smoke",
          731: "sandstorm",
          761: "dust",
          762: "volcano",
          781: "tornado",
          900: "tornado",
          902: "hurricane",
          903: "snowflake-cold",
          904: "hot",
          958: "gale-warning",
          959: "gale-warning",
          960: "storm-warning",
          961: "storm-warning",
          962: "hurricane",
        };
        var dayCond = {
          721: "haze",
          800: "sunny",
        };
        var nightCond = {
          800: "clear",
          701: "fog",
          741: "fog",
        };

        icon.name = cond[wId] ? cond[wId] : icon.name;
        icon.name = neutralCond[wId] ? neutralCond[wId] : icon.name;
        icon.name = dayCond[wId] ? dayCond[wId] : icon.name;
        var time = "day";
        if (sunrise && sunset) {
          var now = Date.now() / 1000;
          var srDate = new Date(sunrise * 1000);
          if (srDate.getDate() == new Date().getDate()) {
            if (now <= sunrise && now >= sunset) {
              time = nightCond[wId] ? "night" : "night-alt";
              icon.name = nightCond[wId] ? nightCond[wId] : icon.name;
            }
          } else {
            time = nightCond[wId] ? "night" : "night-alt";
            icon.name = nightCond[wId] ? nightCond[wId] : icon.name;
          }
        }
        if (icon.name != "na" && !neutralCond[wId]) {
          icon.name = "wi-" + time + "-" + icon.name;
        } else {
          icon.name = "wi-" + icon.name;
        }
        icon.animation =
          icon.name == "wi-day-sunny" ? "wi-rotate" : icon.animation;
        return icon;
      }
    }; //end getWeatherIcon

    Weather.prototype.displayWeatherIcon = function (selector, icon) {
      //display weather icon. first arg is where to display. Second arg is what returned from getWeatherIcon method.
      if (selector && typeof icon == "object") {
        if (icon.name != "na") {
          $(selector).addClass(icon.name);
          animate(selector, icon.animation, 2000, 0, "linear", "infinite");
        }
      }
    };

    Weather.prototype.currentWeather = function () {
      //get current weather from openweather API, format, and display it.
      if (this.location) {
        function setMain(res) {
          if (res.main) {
            $("#temperature").text(Math.round(res.main.temp) + "°");
            $("#description").text(res.weather[0].description);
            if (res.main.humidity) {
              $("#humidity").text(res.main.humidity);
            } else {
              $("#humidity").text("0");
            }
          }
        }

        $.getJSON(
          "https://api.openweathermap.org/data/2.5/weather",
          {
            q: this.location,
            units: "metric",
            appid: "bc1301b0b23fe6ef52032a7e5bb70820",
          },
          function (json) {
            var wId = json.weather[0].id;
            if (wId) {
              var icon = this.getWeatherIcon(
                wId,
                json.sys.sunrise,
                json.sys.sunset
              );
              this.displayWeatherIcon("#wicon-main", icon);
            }
            setMain(json);
          }.bind(this)
        );
      }
    }; //end currentWeather

    Weather.prototype.forecast = function () {
      //get forecast (4 days) weather from openweather API, format, and display it.
      function setForecast(res) {
        this.daily = [];
        var list = res.list;
        for (var i = 0, len = list.length; i < len; i++) {
          this.daily[i] = this.daily[i] ? this.daily[i] : {};
          this.daily[i].maxTemp = Math.round(list[i].temp.max);
          this.daily[i].minTemp = Math.round(list[i].temp.min);
          this.daily[i].day = new Date(list[i].dt * 1000).getDay();
          var iconId = list[i].weather[0].id;
          this.daily[i].icon = this.getWeatherIcon(iconId);
        }
      }
      function displayForecast() {
        var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          _this = this;
        $(".days-box")
          .children(".col-6")
          .each(function (index) {
            $(this).children(".day").text(days[_this.daily[index].day]);
            $(this)
              .find(".d-min-temp")
              .text(_this.daily[index].minTemp + "°");
            $(this)
              .find(".d-max-temp")
              .text(_this.daily[index].maxTemp + "°");
            $(this).find(".wi").addClass(_this.daily[index].icon.name);
          });
      }

      $.getJSON(
        "https://api.openweathermap.org/data/2.5/forecast/daily",
        {
          q: this.location,
          cnt: 4,
          units: "metric",
          appid: "bc1301b0b23fe6ef52032a7e5bb70820",
        },
        function (json) {
          setForecast.call(this, json);
          displayForecast.call(this);
        }.bind(this)
      );
    };

    Weather.prototype.setUnit = function () {
      //Switch between Celsius and Farhenheit
      var prevUnit = "C";
      $("#unit-switch").on("click", function () {
        var newUnit = prevUnit == "C" ? "F" : "C";
        $("span:contains('°')").each(function (index, el) {
          var temp_current = parseFloat($(el).text());
          if (newUnit == "F") {
            var temp_new = Math.round(temp_current * 1.8 + 32);
          } else if (newUnit == "C") {
            var temp_new = Math.round((temp_current - 32) / 1.8);
          }
          $(el).text(temp_new + "°");
          animate(el, "fadeIn", 400, 0, "ease-out");
        });

        prevUnit = newUnit;
      });
    };

    Weather.prototype.loadAnimation = function () {
      $(".loading").css("display", "block");
      var countAjax = 0;
      $(document).ajaxComplete(function () {
        countAjax++;
        if (countAjax == 2) {
          $(".loading").fadeOut();
          loadTooltips();
          animate(".days-box", "scale", 400, 500, "ease-out");
          var delayAnim = 1300;
          $(".days-box")
            .children(".col-xs-3")
            .each(function () {
              animate(this, "fadeIn", 350, delayAnim, "ease-out");
              delayAnim += 350;
            });
        }
      });
    };

    //Animation using CSS @keyframes
    function animate(
      selector,
      keyFrameName,
      duration,
      delay = 0,
      timing = "ease",
      iteration = 1
    ) {
      //jQuery selector; CSS keyframes name; duration in ms; delay in ms;
      $(selector).css({ visibility: "hidden" });
      setTimeout(function () {
        $(selector).css({ visibility: "visible" });
        $(selector).css({
          animation:
            keyFrameName + " " + duration + "ms " + timing + " " + iteration,
        });
      }, delay);
      if (iteration != "infinite") {
        setTimeout(function () {
          $(selector).css({ animation: "" });
        }, (delay + duration) * iteration);
      }
    }
    /* https://codepen.io/sinapsis7 */
    function loadTooltips() {
      //search for elements that have data-tooltips attributes on the web page, and display it.
      $("[data-tooltip]").each(function () {
        var tag = $(this)[0].tagName.toLowerCase();
        var tooltip = $(this).attr("data-tooltip");
        var tooltipParentH = $(this).outerHeight();
        var parentPosition = $(this).position();
        $(tooltip).insertAfter(this);
        $(tooltip).css({
          "max-width":
            document.body.clientWidth - parentPosition.left - 5 + "px",
          transition: "opacity 0.3s",
        });

        function showTooltip() {
          $(tooltip).css({
            visibility: "visible",
            opacity: 1,
            top: parentPosition.top + tooltipParentH + 10 + "px",
            left: parentPosition.left + "px",
          });
        }
        function hideTooltip() {
          $(tooltip).on("mouseenter", stopTimerHide);
          function stopTimerHide() {
            clearTimeout(timerHide);
            $(tooltip).on("mouseleave", hideTooltip);
          }
          var timerHide = setTimeout(function () {
            $(tooltip).css({ visibility: "hidden", opacity: 0 });
          }, 100);
        }

        var _this = $(this);
        if (tag == "input") {
          $(this).on("focus", function () {
            showTooltip();
            _this.off("mouseleave", hideTooltip);
          });
          $(this).on("blur", function () {
            hideTooltip();
            _this.on("mouseleave", hideTooltip);
          });
          $(this).on("mouseenter", showTooltip);
          $(this).on("mouseleave", hideTooltip);
        } else {
          $(this).on("mouseenter", showTooltip);
          $(this).on("mouseleave", hideTooltip);
        }
      });
    }

    //Run
    var weather = new Weather();
    $(document).ready(function () {
      $("#unit-switch").prop("checked", true);

      weather.loadAnimation();
      weather.setDate();
      weather.getLocation();
      weather.setLocation();
      weather.setUnit();
    });
  }

  render() {
    return (
      <div className="App">
        <div className="loading">
          <div className="spinner">
            <div className="dot1"></div>
            <div className="dot2"></div>
          </div>
        </div>
        <section id="main">
          <div className=" w-section text-shadow">
            <div className="container">
              <div className="col-12">
                <div className="row text-white w-header">
                  <div className="col-lg-6 offset-lg-3 col-md-6 offset-md-3 col-sm-10 offset-sm-1">
                    <div className="row">
                      <div className="col-xs-5 text-right">
                        <span id="date"></span>
                      </div>
                    </div>
                    <div className="row">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="">
                          <form id="f_locator">
                            <div
                              id="w-search-tip"
                              className="tooltiptext text-light"
                            >
                              <p>
                                You can get weather by city name or city name
                                and{" "}
                                <a
                                  href="https://www.iso.org/obp/ui/#search"
                                  className="text-accent"
                                  target="_blank"
                                >
                                  iso country code (alpha-2 code)
                                </a>{" "}
                                divided by comma.
                              </p>
                              <h5>Example:</h5>
                              <p className="text-white">
                                <strong>London, uk</strong>
                              </p>
                            </div>
                            <input
                              type="text"
                              id="location"
                              className="form-control"
                              style={{
                                backgroundColor: "white",
                                borderRadius: "20px",
                                width: "500px",
                                paddingTop: "5px",
                                paddingBottom: "5px",
                                paddingLeft: "10px",
                                paddingRight: "10px",
                              }}
                              data-tooltip="#w-search-tip"
                              onChange={(event) => {
                                console.log(event);
                              }}
                            />
                          </form>
                          <span className="glyphicon glyphicon-map-marker"></span>
                        </div>
                        <div className="unit-block text-accent text-left">
                          <div className="onoffswitch">
                            <input
                              type="checkbox"
                              name="onoffswitch"
                              className="onoffswitch-checkbox"
                              id="unit-switch"
                              defaultChecked
                            />
                            <label
                              className="onoffswitch-label"
                              htmlFor="unit-switch"
                            >
                              <span className="onoffswitch-inner"></span>
                              <span className="onoffswitch-switch"></span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row text-white w-main">
                  <div className="col-lg-6 offset-lg-3 col-md-6 offset-md-3 col-sm-10 offset-sm-1">
                    <div className="text-center">
                      <i id="wicon-main" className="wi wi-main"></i>
                      <span id="temperature"></span>
                    </div>
                    <div className="row">
                      <div className="col-xs-12 w-desc-box">
                        <p
                          style={{ textAlign: "center" }}
                          id="description"
                          className="text-capitalize"
                        ></p>
                        <h2 style={{ textAlign: "center" }}>
                          <span id="humidity"></span>{" "}
                          <i className="wi wi-humidity"></i> Humidity
                        </h2>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="container card-section mb-5">
            <div className="row">
              <div className="col-lg-6 offset-lg-3 col-md-6 offset-md-3 col-sm-10 offset-sm-1">
                <div
                  className="days-box row text-center "
                  // style={{ backgroundColor: "whitesmoke" }}
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.55)" }}
                >
                  <div className="col-6 day-first">
                    <p className="day"></p>
                    <hr className="hr-title hr-title-primary" />
                    <p>
                      <i className="fas fa-cloud"></i>
                      {/* <FontAwesomeIcon icon="fa-light fa-cloud" /> */}
                    </p>
                    <p>
                      <span className="d-min-temp"></span>{" "}
                      <span className="d-max-temp">10C</span>
                    </p>
                  </div>
                  <div className="col-6">
                    <p className="day"></p>
                    <hr className="hr-title hr-title-primary" />
                    <p>
                      <i className="fas fa-cloud-rain"></i>
                    </p>
                    <p>
                      <span className="d-min-temp"></span>{" "}
                      <span className="d-max-temp"></span>
                    </p>
                  </div>
                  <div className="col-6">
                    <p className="day"></p>
                    <hr className="hr-title hr-title-primary" />
                    <p>
                      <i className="fas fa-cloud-showers-heavy"></i>
                    </p>
                    <p>
                      <span className="d-min-temp"></span>{" "}
                      <span className="d-max-temp"></span>
                    </p>
                  </div>
                  <div className="col-6">
                    <p className="day"></p>
                    <hr className="hr-title hr-title-primary" />
                    <p>
                      <i className="fas fa-cloud-sun"></i>
                    </p>
                    <p>
                      <span className="d-min-temp"></span>{" "}
                      <span className="d-max-temp"></span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* <section>
			<div className="container text-center">
				<div className="row" id="me">
					<p id="pBy"><span className="glyphicon glyphicon-console"></span><span> coded by</span></p><p id="pMe"><a href="https://codepen.io/sinapsis7">Agustin Matumoto</a></p>
				</div>
			</div>
		</section> */}
      </div>
    );
  }
}

export default App;
