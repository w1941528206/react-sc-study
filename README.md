# react-sc-study
source code debug

## 源码调试
### build link
- 文章: https://juejin.cn/post/7168821587251036167
- build: yarn build react/index,react/jsx,react-dom/index,scheduler --type=NODE
- 其他内容:
  - 打包需要jdk: https://www.azul.com/downloads/?package=jdk macos ARM .dmg
  - 另外一个报错需要修改host

```
  # GitHub Start
  192.30.255.112  gist.github.com
  192.30.255.112  github.com
  192.30.255.112  www.github.com
  151.101.56.133  avatars0.githubusercontent.com
  151.101.56.133  avatars1.githubusercontent.com
  151.101.56.133  avatars2.githubusercontent.com
  151.101.56.133  avatars3.githubusercontent.com
  151.101.56.133  avatars4.githubusercontent.com
  151.101.56.133  avatars5.githubusercontent.com
  151.101.56.133  avatars6.githubusercontent.com
  151.101.56.133  avatars7.githubusercontent.com
  151.101.56.133  avatars8.githubusercontent.com
  151.101.56.133  camo.githubusercontent.com
  151.101.56.133  cloud.githubusercontent.com
  151.101.56.133  gist.githubusercontent.com
  151.101.56.133  marketplace-screenshots.githubusercontent.com
  151.101.56.133  raw.githubusercontent.com
  151.101.56.133  repository-images.githubusercontent.com
  151.101.56.133  user-images.githubusercontent.com
  # GitHub End
```

- 文章: https://juejin.cn/post/7184408692262404152#heading-0
- b站视频: https://www.bilibili.com/video/BV1He4y1V72s/?spm_id_from=333.999.0.0&vd_source=b4c15a99a202087ce063b08f8614425c

## 问题
- flow类型问题
  - npm install --global flow-remove-types
  - flow-remove-types --help
  - flow-remove-types --out-dir src/react src/react
  - 存在一些需要手动处理