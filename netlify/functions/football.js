exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const path = event.queryStringParameters?.path || "competitions/WC/matches";
  const status = event.queryStringParameters?.status || "";
  const matchId = event.queryStringParameters?.matchId || "";

  let url;
  if (matchId) {
    url = `https://api.football-data.org/v4/matches/${matchId}`;
  } else {
    url = `https://api.football-data.org/v4/${path}${status ? `?status=${status}` : ""}`;
  }

  try {
    const res = await fetch(url, {
      headers: {
        "X-Auth-Token": process.env.FOOTBALL_API_KEY || "1c977bce952c48e18140ca4307bf2899",
      },
    });

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers,
        body: JSON.stringify({ error: `API error: ${res.status}` }),
      };
    }

    const data = await res.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
