import request from '@/utils/request';

// 用户注册
const register = ({ sid, password }:any) => {
  return request.post('/api/auth/register', { sid, password });
};

// 用户登录
const login = ({ sid, password }:any) => {
  return request.post('/api/auth/login', { sid, password });
};

// 获取用户信息
const info = () => {
  return request.get('/api/auth/info');
};

const update =({id, password})=>{
  return request.put('/api/auth/'+id, {password});
};

const updateinfo =({id, name, classname, gender, email, telephone})=>{
  return request.post('/api/auth/'+id, {name, classname, gender, email, telephone});
};

const remove = ({id}) => {
  return request.delete('/api/auth/'+id);
};

const message = ({sid}:any) => {
  return request.post('/api/message', {sid});
};

export default {
  register,
  info,
  login,
  update,
  updateinfo,
  remove,
  message,
};
