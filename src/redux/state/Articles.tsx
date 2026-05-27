import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const articlesSlice = createSlice({
  name: 'articles',
  initialState: {
    articles: [],
    articlesUpdate: null,
  },
  reducers: {
    updateArticles: (state, action: PayloadAction<any | 'reset'>) => {
      if (action.payload === 'reset') {
        state.articlesUpdate = null;
        return;
      }
      state.articlesUpdate = action.payload;
    },
    setArticles: (state, action: PayloadAction<any>) => {
      state.articles = action.payload;
    },
  },
});

export const { updateArticles, setArticles } = articlesSlice.actions;

export default articlesSlice.reducer;
