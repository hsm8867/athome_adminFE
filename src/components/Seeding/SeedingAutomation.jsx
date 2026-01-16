import React, { useState } from 'react';
import { Button, Table, Upload, message, Tag, Space, Typography, Modal, Radio } from 'antd';
import { UploadOutlined, DownloadOutlined, MailOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;

const SeedingAutomation = () => {
  const [data, setData] = useState([]); 
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [sheetNames, setSheetNames] = useState([]); 
  const [currentWorkbook, setCurrentWorkbook] = useState(null); 
  const [selectedSheet, setSelectedSheet] = useState(''); 

  // ✅ [수정됨] '컨택포인트' 키워드 추가!
  const COLUMN_MAPPING = {
    name: ['이름', 'name', '채널명', '유튜브채널명', '인플루언서', 'channelname', 'channel', '유튜브'],
    email: [
        '이메일', 'email', '메일주소', 'contact', '연락처', 'address', 
        '컨택포인트', 'contactpoint', '메일', 'contactinfo' // 👈 여기에 다 추가했습니다.
    ],
  };

  const handleUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const binaryStr = e.target.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const sheets = workbook.SheetNames;
        
        if (sheets.length === 0) {
          message.error("엑셀 파일에 시트가 없습니다.");
          return;
        }

        setSheetNames(sheets);
        setCurrentWorkbook(workbook);
        setSelectedSheet(sheets[0]); 
        setIsModalVisible(true);

      } catch (error) {
        console.error(error);
        message.error("엑셀 파일 읽기 실패");
      }
    };
    reader.readAsBinaryString(file);
    return false; 
  };

  // 헤더 위치 자동 찾기 및 데이터 파싱
  const loadDataFromSheet = () => {
    if (!currentWorkbook || !selectedSheet) return;

    const sheet = currentWorkbook.Sheets[selectedSheet];
    
    // 1. Raw Data 읽기
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rawData.length === 0) {
      message.warning("데이터가 없습니다.");
      return;
    }

    // 2. 헤더 행(Row) 찾기
    let headerRowIndex = -1;
    
    for (let i = 0; i < Math.min(rawData.length, 20); i++) { 
      // 엑셀의 모든 셀 값을 공백제거+소문자로 변환해서 검사
      const row = rawData[i].map(cell => String(cell).replace(/\s+/g, '').toLowerCase()); 
      
      const hasName = COLUMN_MAPPING.name.some(key => row.includes(key));
      const hasEmail = COLUMN_MAPPING.email.some(key => row.includes(key));

      if (hasName || hasEmail) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      message.error("헤더(이름, 이메일, 컨택포인트 등)를 찾을 수 없습니다.");
      setIsModalVisible(false);
      return;
    }

    // 3. 찾은 위치부터 JSON 파싱
    const jsonData = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });

    // 4. 데이터 매핑
    const formattedData = jsonData.map((row, index) => {
      
      const findValue = (mappingKeys) => {
        const rowKeys = Object.keys(row);
        
        for (const mapKey of mappingKeys) {
          // 헤더명도 공백제거+소문자로 비교
          const foundKey = rowKeys.find(k => k.replace(/\s+/g, '').toLowerCase() === mapKey);
          if (foundKey && row[foundKey]) {
            return row[foundKey];
          }
        }
        return '';
      };

      return {
        key: index,
        name: findValue(COLUMN_MAPPING.name) || '-',
        email: findValue(COLUMN_MAPPING.email) || '-',
        
        emailStatus: '대기',      
        shippingInfo: '미입력',   
        shippingStatus: '발송전', 
        trackingStatus: '확인불가'
      };
    });

    // 빈 데이터 필터링
    const filteredData = formattedData.filter(item => item.name !== '-' || item.email !== '-');

    setData(filteredData);
    message.success(`'${selectedSheet}' 시트에서 ${filteredData.length}건을 불러왔습니다.`);
    
    setIsModalVisible(false);
    setCurrentWorkbook(null);
  };

  const handleSendEmail = (record) => {
    const newData = data.map(item => 
        item.key === record.key ? { ...item, emailStatus: '발송완료' } : item
    );
    setData(newData);
    message.success(`${record.name}님에게 메일을 보냈습니다.`);
  };

  const columns = [
    { 
      title: '인플루언서 이름', dataIndex: 'name', key: 'name', 
      render: text => <Text strong>{text}</Text> 
    },
    { 
      title: '이메일 (컨택포인트)', dataIndex: 'email', key: 'email',
      render: text => text === '-' ? <Text type="secondary" italic>(없음)</Text> : text
    },
    {
      title: '요청 메일 발송', key: 'action_email', align: 'center',
      render: (_, record) => (
        <Button 
            type="primary" 
            size="small" 
            icon={<MailOutlined />} 
            onClick={() => handleSendEmail(record)}
            disabled={record.emailStatus === '발송완료' || record.email === '-'}
        >
          {record.emailStatus === '발송완료' ? '발송됨' : '메일 발송'}
        </Button>
      ),
    },
    { title: '제품 수취 정보', dataIndex: 'shippingInfo', key: 'shippingInfo', align: 'center', render: s => <Tag>{s}</Tag> },
    { title: '제품 발송', dataIndex: 'shippingStatus', key: 'shippingStatus', align: 'center', render: s => <Tag>{s}</Tag> },
    { title: '발송 현황', dataIndex: 'trackingStatus', key: 'trackingStatus', align: 'center', render: s => <span style={{fontSize:'12px', color:'#888'}}>{s}</span> },
  ];

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Upload beforeUpload={handleUpload} accept=".xlsx, .xls" showUploadList={false}>
            <Button type="primary" icon={<UploadOutlined />} style={{ backgroundColor: '#1f1f1f', borderColor: '#1f1f1f' }}>
              엑셀 업로드
            </Button>
          </Upload>
          <span style={{ fontSize: '12px', color: '#888' }}>
            * 헤더(이름, 컨택포인트 등) 위치를 자동으로 찾아 불러옵니다.
          </span>
        </Space>
        <Button icon={<DownloadOutlined />}>양식 다운로드</Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={data} 
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: '엑셀 파일을 업로드하고 시트를 선택해주세요.' }}
      />

      <Modal
        title="데이터를 불러올 시트를 선택하세요"
        open={isModalVisible}
        onOk={loadDataFromSheet}
        onCancel={() => setIsModalVisible(false)}
        okText="불러오기"
        cancelText="취소"
      >
        <div style={{ marginBottom: 16 }}>
           <Text type="secondary">헤더가 1번째 줄에 없어도 자동으로 찾아서 데이터를 가져옵니다.</Text>
        </div>
        <Radio.Group onChange={(e) => setSelectedSheet(e.target.value)} value={selectedSheet}>
          <Space direction="vertical">
            {sheetNames.map(sheet => (
              <Radio key={sheet} value={sheet}>{sheet}</Radio>
            ))}
          </Space>
        </Radio.Group>
      </Modal>
    </div>
  );
};

export default SeedingAutomation;