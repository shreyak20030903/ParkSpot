import axios from 'axios';

// Change this if your backend runs on a different port
const API = axios.create({
  baseURL: 'http://localhost:8080',
});

export default API;
