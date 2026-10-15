import { createSlice } from '@reduxjs/toolkit';
import { UserInfo } from '../../models/user.model';
import { clearLocalStorage, persistLocalStorage } from '../../utils/localStorage.utility';

export const EmptyUserState: UserInfo = {
  id: null,
  _id: null,
  name: '',
  email: '',
  companyIds: [],
  activeCompanyId: null,
  activeBranchId: null,
};

export const UserKey = 'user';

export const UserFixoraSlice = createSlice({
  name: 'user',
  initialState: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : EmptyUserState,
  reducers: {
    createUser: (_, action) => {
      persistLocalStorage<UserInfo>(UserKey, action.payload);

      return action.payload;
    },
    updateUser: (state, action) => {
      const result = { ...state, ...action.payload };
      persistLocalStorage<UserInfo>(UserKey, result);
      return result;
    },
    resetUser: () => {
      clearLocalStorage(UserKey);
      return EmptyUserState;
    },
    setActiveCompany: (state, action: { payload: number }) => {
      const result = { ...state, activeCompanyId: action.payload };
      persistLocalStorage(UserKey, result);
      return result;
    },
    setActiveBranch: (state, action: { payload: number }) => {
      const result = { ...state, activeBranchId: action.payload };
      persistLocalStorage(UserKey, result);
      return result;
    },
  }
});

export const { createUser, updateUser, resetUser, setActiveCompany, setActiveBranch } = UserFixoraSlice.actions;

export default UserFixoraSlice.reducer;