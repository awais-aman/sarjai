import fs from "fs";

const companyMap = {};

export const getTickerById = (req, res) => {
  const { tickerId } = req.params;
  const { data: companies } = JSON.parse(
    fs.readFileSync("./data.json", "utf8")
  );

  const company = companies.find((company) => {
    const companyTicker = company[2];
    return companyTicker.toLowerCase() === tickerId.toLowerCase();
  });

  if (!company) {
    return res.status(404).send("Ticker not found");
  }

  const [cik, name, ticker, exchange] = company;
  companyMap[tickerId] = (companyMap[tickerId] || 0) + 1;

  res.status(200).json({ cik, name, ticker, exchange });
};

export const getTickerActivity = (req, res) => {
  const sortedCompanyMap = Object.keys(companyMap).sort(
    (a, b) => companyMap[b] - companyMap[a]
  );

  res
    .status(200)
    .send(sortedCompanyMap.map((key) => ({ [key]: companyMap[key] })));
};
