export default () => ({
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,

    accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES,
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES,
  },
});
