import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { List, Input, Button, Modal, Avatar, message } from "antd";
import { PlusOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";

interface Contact {
  id: string;
  name: string;
  email: string;
}

const initialContacts: Contact[] = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com" },
  { id: "2", name: "Bob Smith", email: "bob@example.com" },
  { id: "3", name: "Carol Williams", email: "carol@example.com" },
];

const Contacts: React.FC = () => {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) =>
    name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);

  const handleAdd = () => {
    const email = newEmail.trim();
    if (!email) return;
    if (contacts.some((c) => c.email === email)) return;
    const newContact: Contact = {
      id: Date.now().toString(),
      name: email.split("@")[0],
      email,
    };
    setContacts([...contacts, newContact]);
    setNewEmail("");
    setAddOpen(false);
    message.success("OK");
  };

  const handleRemove = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1e293b" }}>
          {t("contacts.title")}
        </h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
          {t("contacts.addContact")}
        </Button>
      </div>

      <Input
        placeholder={t("contacts.searchPlaceholder")}
        prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 400, borderRadius: 8 }}
        allowClear
      />

      <List
        dataSource={filtered}
        locale={{ emptyText: t("contacts.noContacts") }}
        style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" }}
        renderItem={(item) => (
          <List.Item
            style={{ padding: "12px 16px" }}
            actions={[
              <Button key="remove" type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemove(item.id)} />,
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar style={{ backgroundColor: "#3b82f6", fontWeight: 600 }}>{getInitials(item.name)}</Avatar>}
              title={<span style={{ fontWeight: 500 }}>{item.name}</span>}
              description={<span style={{ color: "#94a3b8" }}>{item.email}</span>}
            />
          </List.Item>
        )}
      />

      <Modal
        title={t("contacts.addContact")}
        open={addOpen}
        onCancel={() => { setAddOpen(false); setNewEmail(""); }}
        onOk={handleAdd}
        okButtonProps={{ disabled: !newEmail.trim() }}
      >
        <Input
          placeholder={t("contacts.email")}
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onPressEnter={handleAdd}
          style={{ marginTop: 8 }}
        />
      </Modal>
    </div>
  );
};

export default Contacts;
