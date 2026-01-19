import React, { useState, useEffect } from 'react';
import { Radio } from 'antd';
import axios from 'axios';

//  [경로 수정] ../components 폴더에서 불러옵니다.
import YoutubeAccount from '../components/YoutubeViral/YoutubeAccount';
import YoutubeDashboard from '../components/YoutubeViral/YoutubeDashboard';
import CreatedComments from '../components/YoutubeViral/CreatedComments';
import YoutubePrompt from '../components/YoutubeViral/YoutubePrompt';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const YoutubeViral = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [videos, setVideos] = useState([]);
  const [selectedVideoKey, setSelectedVideoKey] = useState(null);

  const fetchVideos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/youtube/videos`);
      const formattedData = response.data.map(v => ({
        key: v.id,
        title: v.title,
        url: v.url,
        status: v.status,
        ...v
      }));
      setVideos(formattedData);
    } catch (error) {
      console.error("영상 목록 로딩 실패:", error);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleTabChange = (e) => {
    setActiveTab(e.target.value);
  };

  const handleGoToComments = (record) => {
    setSelectedVideoKey(record.key); 
    setActiveTab('comments');        
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Radio.Group 
          value={activeTab} 
          onChange={handleTabChange} 
          buttonStyle="solid" 
          size="large"
        >
          <Radio.Button value="account" style={{ width: '140px', textAlign: 'center' }}>유튜브 계정</Radio.Button>
          <Radio.Button value="dashboard" style={{ width: '140px', textAlign: 'center' }}>댓글 생성 & 등록</Radio.Button>
          <Radio.Button value="comments" style={{ width: '140px', textAlign: 'center' }}>등록된 댓글 확인</Radio.Button>
          <Radio.Button value="prompt" style={{ width: '150px', textAlign: 'center' }}>프롬프트(준비중)</Radio.Button>
        </Radio.Group>
      </div>

      {activeTab === 'account' && <YoutubeAccount />}
      
      {activeTab === 'dashboard' && (
        <YoutubeDashboard 
          data={videos} 
          onGoToComments={handleGoToComments} 
        />
      )}
      
      {activeTab === 'comments' && (
        <CreatedComments 
          data={videos} 
          selectedVideoKey={selectedVideoKey} 
          onSelectVideo={setSelectedVideoKey} 
        />
      )}
      
      {activeTab === 'prompt' && <YoutubePrompt />}
    </div>
  );
};

export default YoutubeViral;