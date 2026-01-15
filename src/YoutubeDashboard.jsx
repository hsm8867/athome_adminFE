import React, { useState } from 'react';
import { Table, Tag, Space, Button, message, Popconfirm } from 'antd'; // ✅ Popconfirm 등 추가
import { VideoCameraOutlined, CommentOutlined, RobotOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_BASE_URL = 'http://34.64.158.35:8000';


const getYoutubeThumbnail = (url) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://img.youtube.com/vi/${match[2]}/0.jpg`;
  }
  return 'https://via.placeholder.com/120x90?text=No+Image';
};

// ✅ props로 onGoToComments(댓글 보러가기 함수)를 받습니다.
const YoutubeDashboard = ({ data, onGoToComments }) => {
  const [loadingId, setLoadingId] = useState(null); // 로딩 상태 관리

  // ✅ [핵심] 댓글 생성 요청 함수 (n8n 호출)
  const handleGenerate = async (record) => {
    setLoadingId(record.key); // 로딩 아이콘 돌리기 시작
    
    try {
      // 📡 요청하신 URL: /youtube/{video_id}/generate 호출
      // record.key가 video_id 입니다.
      const url = `${API_BASE_URL}/youtube/${record.key}/generate`;
      
      console.log(`📡 댓글 생성 요청 시작: ${url}`);
      
      // POST 요청 전송
      await axios.post(url);
      
      message.success(`'${record.title}' 댓글 생성을 요청했습니다! (n8n 실행됨)`);
      
    } catch (error) {
      console.error("댓글 생성 요청 실패:", error);
      
      // 에러 메시지 처리
      if (error.response && error.response.status === 404) {
        message.error("API 주소를 찾을 수 없습니다. (백엔드 router prefix 확인 필요)");
      } else {
        message.error('댓글 생성 요청 실패');
      }
    } finally {
      setLoadingId(null); // 로딩 끝
    }
  };

  const columns = [
    {
      title: '영상 제목',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space>
          <VideoCameraOutlined />
          <a href={record.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
            {text}
          </a>
        </Space>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === '업로드 완료') color = 'green';
        else if (status === '댓글 생성 요청') color = 'processing';
        else if (status === '대기 중') color = 'warning';
        return <Tag color={color}>{status}</Tag>;
      },
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
      title: '작업',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          {/* ✅ 1. 댓글 생성 버튼 (n8n 호출) */}
          <Popconfirm
            title="댓글을 생성하시겠습니까?"
            description="AI가 영상을 분석하여 댓글을 생성합니다."
            onConfirm={() => handleGenerate(record)}
            okText="생성"
            cancelText="취소"
          >
            <Button 
              icon={<RobotOutlined />} 
              size="small" 
              loading={loadingId === record.key} // 로딩 중이면 뺑뺑이 돔
            >
              댓글 생성
            </Button>
          </Popconfirm>

          {/* ✅ 2. 생성된 댓글 보러가기 버튼 (페이지 이동) */}
          <Button 
            type="primary" 
            ghost
            size="small" 
            icon={<CommentOutlined />}
            onClick={() => onGoToComments(record)} // App.js에서 받은 함수 실행
          >
            댓글 보기
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table 
      columns={columns} 
      dataSource={data} 
      pagination={{ pageSize: 5 }} 
    />
  );
};

export default YoutubeDashboard;
