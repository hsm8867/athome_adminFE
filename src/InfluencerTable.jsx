import React, { useState } from 'react';
import { Table, Tag, Input, message, Image } from 'antd';
import axios from 'axios';

const { Search } = Input;

const InfluencerTable = () => {
  // 1. 상태 관리
  const [data, setData] = useState([]);       // 테이블 데이터
  const [loading, setLoading] = useState(false); // 로딩 상태

  // 2. 검색 함수 (백엔드 API 호출)
  const onSearch = async (value) => {
    if (!value) {
      message.warning('검색어를 입력해주세요!');
      return;
    }

    setLoading(true); // 로딩 시작
    try {
      // 백엔드(9000번) 호출
      const response = await axios.get(`http://localhost:9000/youtube/search`, {
        params: { keyword: value }
      });
      
      setData(response.data); // 받아온 데이터로 교체
      message.success(`${response.data.length}명의 인플루언서를 찾았습니다.`);
      
    } catch (error) {
      console.error(error);
      message.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false); // 로딩 끝
    }
  };

  // 3. 테이블 컬럼 정의
  const columns = [
    {
      title: '프로필',
      dataIndex: 'thumbnail_url',
      key: 'thumbnail',
      render: (url) => <Image width={50} src={url} style={{ borderRadius: '50%' }} />
    },
    { 
      title: '이름', 
      dataIndex: 'display_name', 
      key: 'display_name',
      render: (text, record) => (
        <a href={record.profile_url} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      )
    },
    { title: '플랫폼', dataIndex: 'platform', key: 'platform' },
    { 
      title: '팔로워', 
      dataIndex: 'followers', 
      key: 'followers',
      sorter: (a, b) => a.followers - b.followers, // 정렬 기능 추가
      render: (val) => val.toLocaleString() // 천단위 콤마 찍기
    },
    { 
        title: '해시태그', 
        dataIndex: 'hashtags', 
        key: 'hashtags',
        render: (tags) => (
            <>
                {tags && tags.map(tag => (
                    <Tag key={tag} color="blue">#{tag}</Tag>
                ))}
            </>
        )
    },
    { 
      title: '상태', 
      key: 'status', 
      dataIndex: 'status',
      render: (status) => (
        <Tag color={status === 'SAVED' ? 'green' : 'geekblue'}>
          {status}
        </Tag>
      )
    },
  ];

  return (
    <div>
      {/* 상단 검색창 */}
      <div style={{ marginBottom: 16 }}>
        <Search
          placeholder="유튜브 키워드 검색 (예: skincare)"
          allowClear
          enterButton="검색"
          size="large"
          onSearch={onSearch}
          loading={loading}
        />
      </div>

      {/* 데이터 테이블 */}
      <Table 
        columns={columns} 
        dataSource={data} 
        loading={loading}
        rowKey="platform_user_id" // 데이터의 고유 ID 지정 (필수)
      />
    </div>
  );
};

export default InfluencerTable;