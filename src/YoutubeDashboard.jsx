import React from 'react';
import { Table, Tag, Button } from 'antd'; // ✅ Button 추가됨

// 헬퍼 함수
const getYoutubeThumbnail = (url) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://img.youtube.com/vi/${match[2]}/0.jpg`;
  }
  return 'https://via.placeholder.com/120x90?text=No+Image';
};

// ✅ props로 data와 onGoToComments를 받아옵니다.
const YoutubeDashboard = ({ data, onGoToComments }) => {
  const columns = [
    {
      title: '영상 제목',
      dataIndex: 'title',
      key: 'title',
      width: '20%',
    },
    {
      title: 'YouTube URL',
      dataIndex: 'url',
      key: 'url',
      width: '30%',
      render: (text) => <a href={text} target="_blank" rel="noopener noreferrer">{text}</a>,
    },
    {
      title: '썸네일',
      key: 'thumbnail',
      width: '150px',
      render: (_, record) => (
        <img 
          src={getYoutubeThumbnail(record.url)} 
          alt="thumbnail" 
          style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '4px' }} 
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === '댓글 생성 요청') color = 'lime';
        if (status === '업로드 완료') color = 'green';
        if (status === '대기 중') color = 'gold';

        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        // ✅ 이제 onGoToComments가 props로 들어왔으므로 에러가 나지 않습니다.
        <Button type="primary" size="small" onClick={() => onGoToComments(record)}>
          댓글 보러가기
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h3>댓글 업로드 대시보드</h3>
      {/* ✅ 부모로부터 받은 data를 사용 */}
      <Table 
        columns={columns} 
        dataSource={data} 
        pagination={{ pageSize: 5 }} 
      />
    </div>
  );
};

export default YoutubeDashboard;