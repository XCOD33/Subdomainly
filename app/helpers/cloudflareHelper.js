const axios = require('axios');

exports.listDnsRecords = async (zoneId) => {
  try {
    if (zoneId === null || zoneId === undefined) {
      throw new Error('zoneId is required.');
    }

    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        },
      }
    );
    return response.data.result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
