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
    console.error(error.message || error);
    throw error.message || error;
  }
};

exports.addDnsRecord = async (zoneId, content, name, type, id) => {
  try {
    const response = await axios({
      method: 'post',
      url: `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: {
        content: content,
        name: name,
        type: type,
        id: id,
        comment: 'Added by Cloudflare API',
        proxied: true,
      },
    });

    if (response.status >= 400 || response.data.success === false) {
      throw new Error(response.data.errors ? response.data.errors[0].message : 'Unknown error');
    }

    return response.data.result;
  } catch (error) {
    console.error(
      'Error nih : ',
      console.error('Error Response Data:', error.response.data.errors)
    );
    // console.error('Error in addDnsRecord:', error.message || error);
    throw error; // Throw error untuk ditangkap di luar fungsi
  }
};

exports.updateDnsRecord = async (zoneId, content = null, name = null, type = null, id) => {
  body = {
    proxied: true,
    comment: 'Updated by Cloudflare API',
  };
  if (content) body.content = content;
  if (name) body.name = name;
  if (type) body.type = type;
  try {
    const response = await axios({
      method: 'patch',
      url: `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${id}`,
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: body,
    });

    if (response.status >= 400 || response.data.success === false) {
      throw new Error(response.data.errors ? response.data.errors[0].message : 'Unknown error');
    }

    return response.data.result;
  } catch (error) {
    console.error('Error in updateDnsRecord:', error.message || error);
    throw error;
  }
};

exports.deleteDnsRecord = async (zoneId, id) => {
  try {
    const response = await axios({
      method: 'delete',
      url: `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${id}`,
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status >= 400 || response.data.success === false) {
      throw new Error(response.data.errors ? response.data.errors[0].message : 'Unknown error');
    }

    return response.data.result;
  } catch (error) {
    console.error('Error in deleteDnsRecord:', error.message || error);
    throw error;
  }
};

exports.validateTurnstileToken = async (token) => {
  const secretKey =
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
  const verificationUrl = `https://challenges.cloudflare.com/turnstile/v0/siteverify`;

  try {
    const response = await axios.post(verificationUrl, {
      response: token,
      secret: secretKey,
    });

    if (!response.data.success) {
      const errorCodes = response.data['error-codes'] || [];
      const errorMessage = errorCodes.length > 0 ? errorCodes.join(', ') : 'Unknown error';
      throw new Error(`${errorMessage}`);
    }

    return response.data.success;
  } catch (error) {
    console.error('Error in validateTurnstileToken:', error.message || error);
    throw error;
  }
};
