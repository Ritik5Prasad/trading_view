import { createChart, ColorType } from "lightweight-charts";
import React, { useEffect, useRef, useState } from "react";
import { Colors } from "./Colors";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import io from "socket.io-client";
import { calculatePriceChange } from "./Utils";

function App() {
  const chartContainerRef = useRef();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const theme = queryParams.get("theme") === "dark" ? "dark" : "light";
  const stock = queryParams.get("stock") || null;
  const token = queryParams.get("token") || null;

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

      grid: {
        horzLines: {
          color: theme === "dark" ? Colors.dark_border : Colors.light_border,
        },
        vertLines: {
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

    candleSeries.applyOptions({
      priceLineStyle: 1,
      baseLineStyle: 1,
    });
    chart.timeScale().applyOptions({
      timeVisible: true,
      borderVisible: true,
      barSpacing: 5,
    });
    chart.timeScale().fitContent();

    chart.timeScale().scrollToPosition(5);

    const socket = io(
      // "http://localhost:4000"
      "http://growwserver.ap-south-1.elasticbeanstalk.com:8081",
      {
        withCredentials: true,
        extraHeaders: {
          access_token: token,
        },
      }
    );

    socket.on("connect", () => {
      console.log("Connected to server");
      socket.emit("subscribeToStocks", stock);
    });

    socket.on(stock, (data) => {
      console.log("Receiving");
      const extractData = data.dayTimeSeries;
      setStockData(data);
      if (!initial) {
        candleSeries.setData(extractData);
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
      candleSeries.update(updateRandom);
    });

    window.addEventListener("resize", handleResize);

    return () => {
      socket.disconnect();
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [theme, location.search]);

  return (
    <div>
      {stockData && stockData?.length !== 0 && (
        <div style={styles}>
          <h2
            style={{
              color: theme === "dark" ? Colors.dark_text : Colors.light_text,
              fontWeight: 400,
              fontSize: "16px",
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
              fontSize: "14px",
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
