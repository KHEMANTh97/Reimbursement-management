export interface CountryData {
  name: string;
  currencyCode: string;
  currencySymbol: string;
}

export async function getCountries(): Promise<CountryData[]> {
  try {
    const response = await fetch("https://restcountries.com/v3.1/all?fields=name,currencies");
    const data = await response.json();
    return data.map((country: any) => {
      const currencyCode = Object.keys(country.currencies || {})[0] || "USD";
      const currency = country.currencies?.[currencyCode] || { name: "US Dollar", symbol: "$" };
      return {
        name: country.name.common,
        currencyCode,
        currencySymbol: currency.symbol || currencyCode,
      };
    }).sort((a: any, b: any) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching countries:", error);
    return [{ name: "United States", currencyCode: "USD", currencySymbol: "$" }];
  }
}

export async function getExchangeRates(baseCurrency: string) {
  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    return { [baseCurrency]: 1 };
  }
}

export async function convertCurrency(amount: number, from: string, to: string) {
  if (from === to) return amount;
  const rates = await getExchangeRates(from);
  const rate = rates[to];
  if (rate) {
    return amount * rate;
  }
  return amount;
}
