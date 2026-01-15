import React from 'react';
import { Menu, List, Avatar, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// 헬퍼 함수 (여기서도 쓰이니까 복사해서 넣어주세요, 혹은 utils.js로 빼도 됩니다)
const getYoutubeThumbnail = (url) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://img.youtube.com/vi/${match[2]}/0.jpg`;
  }
  return 'https://via.placeholder.com/320x180?text=No+Thumbnail';
};

const CreatedComments = ({ data, selectedVideoKey, onSelectVideo }) => {
  const activeVideo = data.find((v) => v.key === selectedVideoKey) || data[0];

  return (
    <div style={{ display: 'flex', height: '100%', background: '#fff', padding: '20px' }}>
      {/* 왼쪽: 리스트 */}
      <div style={{ width: '250px', borderRight: '1px solid #f0f0f0', paddingRight: '20px' }}>
        <Title level={4}>영상 목록</Title>
        <Menu
          mode="inline"
          selectedKeys={[activeVideo?.key]}
          onClick={({ key }) => onSelectVideo(key)}
          style={{ borderRight: 0 }}
        >
          {data.map((item) => (
            <Menu.Item key={item.key}>{item.title}</Menu.Item>
          ))}
        </Menu>
      </div>

      {/* 오른쪽: 상세 내용 */}
      <div style={{ flex: 1, paddingLeft: '40px', overflowY: 'auto' }}>
        {activeVideo ? (
          <div>
            <Title level={3}>{activeVideo.title}</Title>
            <div style={{ marginBottom: '30px' }}>
              <img 
                src={getYoutubeThumbnail(activeVideo.url)} 
                alt="Thumbnail" 
                style={{ width: '100%', maxWidth: '480px', borderRadius: '8px' }} 
              />
            </div>
            <Title level={5}>생성된 댓글 ({activeVideo.comments.length})</Title>
            <List
              itemLayout="horizontal"
              dataSource={activeVideo.comments}
              renderItem={(comment, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }} />}
                    title={`추천 댓글 #${index + 1}`}
                    description={<Text copyable>{comment}</Text>}
                  />
                </List.Item>
              )}
            />
          </div>
        ) : (
          <div>영상을 선택해주세요.</div>
        )}
      </div>
    </div>
  );
};

export default CreatedComments;