export const calculatePriceChange = (lastDayTradedPrice, currentPrice) => {
  // Calculate percentage change
  const change = currentPrice - lastDayTradedPrice;
  const percentageChange = (change / lastDayTradedPrice) * 100;

  // Determine if the change is positive or negative
  let isPositive = "";
  if (change > 0) {
    isPositive = "+";
  } else if (change < 0) {
    isPositive = "-";
  }

  return {
    currentPrice,
    percentageChange: `${isPositive}${Math.abs(percentageChange).toFixed(2)}%`,
    isPositive: isPositive === "+" ? true : false,
  };
};
