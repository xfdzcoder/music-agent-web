<template>
  <div class="all-songs">
    <div class="page-header">
      <h1>所有歌曲</h1>
      <p>你的音乐库中共有 0 首歌曲</p>
    </div>
    <div class="empty-state">
      <span class="empty-icon">🎼</span>
      <h2>暂无歌曲</h2>
      <p>开始添加你喜欢的音乐吧</p>
    </div>
  </div>
</template>

<style scoped>
.all-songs {
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
