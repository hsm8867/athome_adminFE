import React, { useState } from 'react';
import { Button, Table, Upload, message, Tag, Space, Typography } from 'antd';
import { UploadOutlined, DownloadOutlined, MailOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx'; // 엑셀 파싱 라이브러리

const { Title } = Typography;

const SeedingAutomation = () => {
  const [data, setData] = useState([]); // 엑셀 데이터 저장
  const [loading, setLoading] = useState(false);

  // 1. 엑셀 파일 업로드 및 파싱 함수
  const handleUpload = (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const binaryStr = e.target.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });

        // 첫 번째 시트 가져오기
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // 엑셀 데이터를 JSON으로 변환
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) {
          message.warning("엑셀 파일에 데이터가 없습니다.");
          return;
        }

        // 데이터에 key(고유값)와 초기 상태값 추가
        const formattedData = jsonData.map((item, index) => ({
          key: index,
          ...item,
          // 엑셀에 없는 필드들은 기본값 세팅
          emailStatus: '대기',      // 요청 메일 발송 상태
          shippingInfo: '미입력',   // 제품 수취 정보
          shippingStatus: '발송전', // 제품 발송
          trackingStatus: '확인불가' // 발송 현황
        }));

        setData(formattedData);
        message.success(`${jsonData.length}개의 데이터를 불러왔습니다.`);
      } catch (error) {
        console.error(error);
        message.error("엑셀 파일 읽기 실패");
      }
    };

    reader.readAsBinaryString(file);
    return false; // antd Upload의 기본 업로드 동작 방지 (서버로 바로 보내지 않음)
  };

  // 2. 메일 발송 버튼 클릭 핸들러
  const handleSendEmail = (record) => {
    message.loading(`${record.name || '인플루언서'}님에게 메일 발송 중...`, 1)
      .then(() => {
        // 여기서 실제 메일 발송 API 호출 로직이 들어갑니다.
        // 성공했다고 가정하고 상태 업데이트:
        const newData = data.map(item => {
          if (item.key === record.key) {
            return { ...item, emailStatus: '발송완료', shippingInfo: '입력대기' };
          }
          return item;
        });
        setData(newData);
        message.success("메일이 발송되었습니다!");
      });
  };

  // 3. 테이블 컬럼 정의
  const columns = [
    {
      title: '인플루언서 이름',
      dataIndex: 'name', // 엑셀 헤더가 'name'이어야 함 (한글이면 '이름' 등)
      key: 'name',
      render: (text) => <strong>{text || '-'}</strong>
    },
    {
      title: '이메일',
      dataIndex: 'email', // 엑셀 헤더 'email'
      key: 'email',
    },
    {
      title: '요청 메일 발송',
      key: 'action_email',
      align: 'center',
      render: (_, record) => (
        // ✅ 유일한 버튼: 메일 발송
        <Button 
          type="primary" 
          size="small" 
          icon={<MailOutlined />}
          onClick={() => handleSendEmail(record)}
          disabled={record.emailStatus === '발송완료'} // 이미 보냈으면 비활성화
        >
          {record.emailStatus === '발송완료' ? '발송됨' : '메일 발송'}
        </Button>
      ),
    },
    {
      title: '제품 수취 정보',
      dataIndex: 'shippingInfo',
      key: 'shippingInfo',
      align: 'center',
      render: (status) => (
        <Tag color={status === '입력완료' ? 'green' : 'default'}>{status}</Tag>
      )
    },
    {
      title: '제품 발송',
      dataIndex: 'shippingStatus',
      key: 'shippingStatus',
      align: 'center',
      render: (status) => (
        <Tag color={status === '발송완료' ? 'blue' : 'warning'}>{status}</Tag>
      )
    },
    {
      title: '발송 현황',
      dataIndex: 'trackingStatus',
      key: 'trackingStatus',
      align: 'center',
      render: (status) => (
         <span style={{ color: '#888', fontSize: '12px' }}>{status}</span>
      )
    },
  ];

  return (
    <div style={{ marginTop: 20 }}>
      {/* 상단 버튼 영역 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          {/* ✅ 엑셀 업로드 (Upload 컴포넌트 사용) */}
          <Upload 
            beforeUpload={handleUpload} 
            accept=".xlsx, .xls" 
            showUploadList={false}
          >
            <Button type="primary" icon={<UploadOutlined />} style={{ backgroundColor: '#1f1f1f', borderColor: '#1f1f1f' }}>
              엑셀 업로드
            </Button>
          </Upload>
          <span style={{ fontSize: '12px', color: '#888' }}>
            * 엑셀 파일 컬럼: name, email (필수)
          </span>
        </Space>

        <Button icon={<DownloadOutlined />}>
          양식 다운로드
        </Button>
      </div>

      {/* ✅ 데이터 테이블 (기존 박스 UI 대신 테이블 사용) */}
      <Table 
        columns={columns} 
        dataSource={data} 
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: '엑셀 파일을 업로드하면 리스트가 표시됩니다.' }}
      />
    </div>
  );
};

export default SeedingAutomation;