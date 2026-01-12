// frontend/src/InfluencerTable.jsx

import React, { useState } from 'react';
import { Table, Tag, Input, message, Image, Card, Space, Typography } from 'antd';
import axios from 'axios';

const { Search } = Input;
const { Title } = Typography;

const InfluencerTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ 검색 함수
  const onSearch = async (value) => {
    // 공백 제거 후 확인
    const keyword = value ? value.trim() : "";
    
    if (!keyword) {
      message.warning('검색어를 입력해주세요!');
      return;
    }

    setLoading(true);
    try {
      console.log(`📡 검색 요청 시작: "${keyword}"`); 

      // 타임아웃을 30초로 넉넉하게 늘림 (백엔드 디버깅용)
      const response = await axios.get(`http://localhost:8000/youtube/search`, {
        params: { keyword: keyword },
        timeout: 30000 
      });
      
      console.log('✅ 검색 결과 수신:', response.data);
      setData(response.data);

      if (response.data.length === 0) {
        message.info('검색 결과가 없습니다.');
      } else {
        message.success(`${response.data.length}명을 찾았습니다.`);
      }
      
    } catch (error) {
      console.error('❌ 검색 에러:', error);
      
      let errorMsg = '데이터 요청 실패';
      if (error.code === 'ECONNABORTED') {
          errorMsg = '응답 시간이 너무 오래 걸립니다. (백엔드 서버 확인 필요)';
      } else if (error.response) {
          errorMsg = `서버 에러 (${error.response.status}): ${error.response.data?.detail || '알 수 없는 오류'}`;
      } else if (error.request) {
          errorMsg = '서버 응답이 없습니다. 백엔드(9000번)가 켜져 있나요?';
      }
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 한글 입력 버그 방지 (Enter 키 처리)
  const handleKeyDown = (e) => {
    // 한글 입력 중(Composing)일 때는 검색을 실행하지 않음
    if (e.nativeEvent.isComposing) return;
    
    if (e.key === 'Enter') {
      onSearch(e.target.value);
    }
  };

  const columns = [
    {
      title: '프로필',
      dataIndex: 'thumbnail_url',
      key: 'thumbnail',
      align: 'center',
      width: 80,
      render: (url) => <Image width={50} src={url} style={{ borderRadius: '50%' }} fallback="https://via.placeholder.com/50" />
    },
    { 
      title: '이름', 
      dataIndex: 'display_name', 
      key: 'display_name',
      render: (text, record) => (
        <a href={record.profile_url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold' }}>
          {text}
        </a>
      )
    },
    { title: '플랫폼', dataIndex: 'platform', key: 'platform', align: 'center' },
    { 
      title: '팔로워', 
      dataIndex: 'followers', 
      key: 'followers',
      sorter: (a, b) => a.followers - b.followers,
      render: (val) => val?.toLocaleString()
    },
    { 
        title: '해시태그', 
        dataIndex: 'hashtags', 
        key: 'hashtags',
        render: (tags) => (
            <Space size={[0, 8]} wrap>
                {tags && tags.map((tag, idx) => (
                    <Tag key={idx} color="blue">#{tag}</Tag>
                ))}
            </Space>
        )
    },
    { 
      title: '상태', 
      key: 'status', 
      dataIndex: 'status',
      align: 'center',
      render: (status) => (
        <Tag color={status === 'SAVED' ? 'green' : (status === 'DRAFT' ? 'default' : 'geekblue')}>
          {status}
        </Tag>
      )
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>인플루언서 목록</Title>
          <Search
            placeholder="유튜브 키워드 검색"
            allowClear
            enterButton="검색"
            size="middle"
            onSearch={onSearch} // 클릭 시 실행
            onKeyDown={handleKeyDown} // 엔터 키 별도 처리
            loading={loading}
            style={{ width: 400 }}
          />
      </div>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
          <Table 
              columns={columns} 
              dataSource={data} 
              loading={loading}
              rowKey="platform_user_id"
              pagination={{ pageSize: 10 }}
          />
      </Card>
    </Space>
  );
};

export default InfluencerTable;