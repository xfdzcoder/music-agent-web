<template>
  <div class="my-playlists">
    <div class="page-header">
      <h1>我的歌单</h1>
      <p>管理你的个人歌单</p>
    </div>
    <div class="empty-state">
      <span class="empty-icon">📁</span>
      <h2>暂无歌单</h2>
      <p>创建你的第一个歌单吧</p>
    </div>
  </div>
</template>

<style scoped>
.my-playlists {
  flex: 1;
  padding: 48px;
  color: white;
}

.page-header h1 {
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.page-header p {
  font-size: 16px;
  margin: 0;
  opacity: 0.7;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 24px;
}

.empty-state h2 {
  font-size: 24px;
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 14px;
  opacity: 0.7;
  margin: 0;
}
</style>
