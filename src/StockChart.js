import React, { useEffect, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";
import { Colors } from "./Colors";

const StockChart = ({ stockData, theme }) => {
  const chartContainerRef = useRef();
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
    chart.timeScale().fitContent();
    chart.timeScale().scrollToPosition(2);
    chart.timeScale().applyOptions({
      timeVisible: true,
    });

    const convertedData = stockData.dayTimeSeries;
    if (!initial) {
      candleSeries.setData(convertedData);
      setInitial(true);
    }
    const updateValue =
      stockData.dayTimeSeries[stockData.dayTimeSeries.length - 1];

    const updateRandom = {
      time: updateValue.time,
      close: updateValue.close,
      high: updateValue.high,
      low: updateValue.low,
      open: updateValue.open,
      _internal_originalTime: updateValue.time,
    };
    const intervalID = setInterval(() => {
      candleSeries.update(updateRandom);
    }, 5000);

    window.addEventListener("resize", handleResize);
    return () => {
      clearInterval(intervalID);
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [theme, stockData]);

  return <div ref={chartContainerRef}></div>;
};

export default StockChart;
