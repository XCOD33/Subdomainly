const axios = require('axios');

exports.sendMessage = async (message) => {
  try {
    const fonnteResponse = await axios({
      method: 'post',
      url: 'https://api.fonnte.com/send',
      data: {
        target: process.env.FONNTE_TARGET,
        message,
        countryCode: '62',
      },
      headers: {
        Authorization: process.env.FONNTE_TOKEN,
      },
    });

    if (fonnteResponse.data.status === false) {
      throw new Error(fonnteResponse.data.reason);
    }

    return fonnteResponse.data.status;
  } catch (error) {
    console.error('Error in sendMessage:', error.message || error);
    throw error;
  }
};
