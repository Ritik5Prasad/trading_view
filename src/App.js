import React, { useEffect, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";
import { Colors } from "./Colors";
import io from "socket.io-client";
import { calculatePriceChange } from "./Utils";
import { useLocation, BrowserRouter as Router } from "react-router-dom";
import Demo from "./AppDemo";

function App() {
  const chartContainerRef = useRef();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const theme = queryParams.get("theme") === "dark" ? "dark" : "light";
  const stock = queryParams.get("stock") || "ZOMATO";
  const token = queryParams.get("access_token") || null;

  const [stockData, setStockData] = useState(null);
  const [initial, setInitial] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
        handleScroll: chart.timeScale().scrollToRealTime(),
      });
    };
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: {
          type: ColorType.Solid,
          color:
            theme === "dark" ? Colors.dark_background : Colors.light_background,
        },
        textColor: theme === "dark" ? Colors.dark_text : Colors.light_text,
      },
      crosshair: {
        mode: 2,
      },
      grid: {
        horzLines: {
          color: theme === "dark" ? Colors.dark_border : Colors.light_border,
          visible: true,
        },
        vertLines: {
          visible: true,
          color: theme === "dark" ? Colors.dark_border : Colors.light_border,
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: window.innerHeight,
    });
    const candleSeries = chart.addCandlestickSeries({
      upColor: Colors.profit,
      borderUpColor: Colors.profit,
      wickUpColor: Colors.profit,
      downColor: Colors.loss,
      borderDownColor: Colors.loss,
      wickDownColor: Colors.loss,
    });
    // chart.timeScale().fitContent();
    chart.timeScale().scrollToPosition(5);
    chart.timeScale().applyOptions({
      timeVisible: true,
    });

    const socket = io("http://localhost:4000", {
      withCredentials: true,
      extraHeaders: {
        access_token:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NjJmMmIwOTA2MjkxOWQ3M2UwM2UzMDUiLCJpYXQiOjE3MTU2NzU0MzksImV4cCI6MTcxODI2NzQzOX0.wpldZqne_azHBQ5dgOtos7pqKiEuDBBA7mNVT8RkQyU",
      },
    });

    socket.on("connect", () => {
      console.log("Connected to server");
      socket.emit("subscribeToStocks", stock);
    });

    socket.on(stock, (data) => {
      console.log("Receiving");
      const convertedData = data.dayTimeSeries;
      setStockData(data);
      if (!initial) {
        candleSeries.applyOptions({
          priceLineStyle: 1,
          baseLineStyle: 1,
        });
        candleSeries.setData(convertedData);
        setInitial(true);
      }
      const updateValue = data.dayTimeSeries[data.dayTimeSeries.length - 1];

      const updateRandom = {
        time: updateValue.time,
        close: updateValue.close,
        high: updateValue.high,
        low: updateValue.low,
        open: updateValue.open,
        _internal_originalTime: updateValue.time,
      };
      console.log(updateRandom);
      candleSeries.update(updateRandom);
    });

    window.addEventListener("resize", handleResize);
    return () => {
      socket.disconnect();
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  return (
    <div>
      {stockData && stockData?.length !== 0 && (
        <div style={styles}>
          <h2
            style={{
              color: theme === "dark" ? Colors.dark_text : Colors.light_text,
              fontWeight: 400,
            }}
          >
            {stock} . 1 . RSE
          </h2>
          <h2
            style={{
              color: calculatePriceChange(
                stockData.lastDayTradedPrice,
                stockData.currentPrice
              ).isPositive
                ? Colors.profit
                : Colors.errorColor,
              fontWeight: 500,
              fontSize: "16px",
            }}
          >
            {stockData &&
              calculatePriceChange(
                stockData.lastDayTradedPrice,
                stockData.currentPrice
              ).currentPrice +
                " (" +
                calculatePriceChange(
                  stockData.lastDayTradedPrice,
                  stockData.currentPrice
                ).percentageChange +
                ")"}
          </h2>
        </div>
      )}

      <div ref={chartContainerRef} />
    </div>
  );
}

function AppWithRouter() {
  return (
    <Router>
      <App />
    </Router>
    // <Demo/>
  );
}

export default AppWithRouter;

const styles = {
  position: "absolute",
  left: "12px",
  top: "12px",
  zIndex: 99,
  lineHeight: "18px",
  fontWeight: 300,
};
