import { createChart, ColorType } from "lightweight-charts";
import React, { useEffect, useRef } from "react";
import { Colors } from "./Colors";
import { BrowserRouter as Router, useLocation } from "react-router-dom";

function generateData(
  numberOfCandles = 500,
  updatesPerCandle = 5,
  startAt = 100
) {
  let randomFactor = 25 + Math.random() * 25;
  const samplePoint = (i) =>
    i *
      (0.5 +
        Math.sin(i / 1) * 0.2 +
        Math.sin(i / 2) * 0.4 +
        Math.sin(i / randomFactor) * 0.8 +
        Math.sin(i / 50) * 0.5) +
    200 +
    i * 2;

  const createCandle = (val, time) => ({
    time,
    open: val,
    high: val,
    low: val,
    close: val,
  });

  const updateCandle = (candle, val) => ({
    time: candle.time,
    close: val,
    open: candle.open,
    low: Math.min(candle.low, val),
    high: Math.max(candle.high, val),
  });

  const date = new Date();
  const numberOfPoints = numberOfCandles * updatesPerCandle;
  const initialData = [];
  const realtimeUpdates = [];
  let lastCandle;
  let previousValue = samplePoint(-1);
  for (let i = 0; i < numberOfPoints; ++i) {
    if (i % updatesPerCandle === 0) {
      date.setUTCDate(date.getUTCDate() + 1);
    }
    const time = date.getTime() / 1000;
    let value = samplePoint(i);
    const diff = (value - previousValue) * Math.random();
    value = previousValue + diff;
    previousValue = value;
    if (i % updatesPerCandle === 0) {
      const candle = createCandle(value, time);
      lastCandle = candle;
      if (i >= startAt) {
        realtimeUpdates.push(candle);
      }
    } else {
      const newCandle = updateCandle(lastCandle, value);
      lastCandle = newCandle;
      if (i >= startAt) {
        realtimeUpdates.push(newCandle);
      } else if ((i + 1) % updatesPerCandle === 0) {
        initialData.push(newCandle);
      }
    }
    date.setTime(date.getTime());
  }

  return {
    initialData,
    realtimeUpdates,
  };
}

function App() {
  const chartContainerRef = useRef();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const theme = queryParams.get("theme") === "dark" ? "dark" : "light";
  const timeFrame = queryParams.get("timeframe") || "1m";

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

    const data = generateData(2500, 20, 1000);

    candleSeries.setData(data.initialData);
    chart.timeScale().fitContent();
    chart.timeScale().scrollToPosition(5);

    function* getNextRealtimeUpdate(realtimeData) {
      for (const dataPoint of realtimeData) {
        yield dataPoint;
      }
      return null;
    }
    const streamingDataProvider = getNextRealtimeUpdate(data.realtimeUpdates);
    const intervalID = setInterval(() => {
      const update = streamingDataProvider.next();
      if (update.done) {
        clearInterval(intervalID);
        return;
      }
      candleSeries.update(update.value);
    }, 1000);

    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(intervalID);
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [theme, timeFrame, location.search]);

  return <div ref={chartContainerRef} />;
}

function Demo() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default Demo;
