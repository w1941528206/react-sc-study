import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __DEV__: true, // 如果 false 跳过 if(__dev__) 的逻辑
    __EXPERIMENTAL__: true,
    __PROFILE__: true
  },
  // 添加 resolve配置 将react react-dom指向本地
  resolve: {
    alias: {
      react: path.posix.resolve("src/react/packages/react"),
      "react-dom": path.posix.resolve("src/react/packages/react-dom"),
      "react-dom-bindings": path.posix.resolve(
        "src/react/packages/react-dom-bindings"
      ),
      "react-reconciler": path.posix.resolve(
        "src/react/packages/react-reconciler"
      ),
      scheduler: path.posix.resolve("src/react/packages/scheduler"),
      shared: path.posix.resolve("src/react/packages/shared"),
    },
  },
})
