import request from '@/utils/request';

// 用户注册
const register = ({ email, name, password }:any) => {
  return request.post('/api/admin/register', { email, name, password });
};

// 用户登录
const login = ({ email, password }:any) => {
  return request.post('/api/admin/login', { email, password });
};

// 获取用户信息
const info = () => {
  return request.get('/api/admin/info');
};

const update =({id, name, password})=>{
  return request.put('/api/admin/'+id, {name, password});
};

const remove = ({id}) => {
  return request.delete('/api/admin/'+id);
};

const show = () => {
  return request.get('/api/admin/show');
}

const search = (word) => {
  return request.get('/api/admin/search', { params: { word } });
}

const msg = () =>{
  return request.get('/api/message/show');
}

const removemsg=({sid})=>{
  return request.delete('/api/message/'+sid);
}

const addclass=({Name})=>{
  return request.post('/api/class/add',{Name});
}

const showclass=() => {
  return request.get('/api/class/show');
}

const deleteclass=({name})=>{
  return request.delete('/api/class/'+name);
}

const updateclass =({name, SchoolName, MajorName})=>{
  return request.post('/api/class/'+name, {SchoolName, MajorName});
};

export default {
  register,
  info,
  login,
  update,
  remove,
  show,
  search,
  msg,
  removemsg,
  addclass,
  showclass,
  deleteclass,
  updateclass,
};
