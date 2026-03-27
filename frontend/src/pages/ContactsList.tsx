import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Users, Phone, Mail } from 'lucide-react';
import { contactsApi, Contact } from '../api/contacts';
import './Dashboard.css';

export const ContactsList: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contactsApi.list()
      .then(data => {
        setContacts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch contacts', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mh-dashboard-page" style={{ padding: '2rem' }}>
      <div className="mh-welcome-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>My Contacts</h2>
          <p>Manage your team members and external clients.</p>
        </div>
        <Button variant="primary">Add Contact</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        {loading ? (
          <p>Loading contacts...</p>
        ) : contacts.length === 0 ? (
          <Card style={{ padding: '3rem', textAlign: 'center', opacity: 0.6, gridColumn: '1 / -1' }}>
            <Users size={48} style={{ margin: '0 auto', marginBottom: '1rem', display: 'block' }} />
            <p>You haven't added any contacts yet.</p>
          </Card>
        ) : (
          contacts.map((contact) => (
            <Card key={contact.id} hoverable style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Avatar 
                  src={contact.contactUser.avatarUrl || undefined} 
                  fallback={contact.contactUser.firstName?.[0] || 'U'} 
                  size="lg" 
                />
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                    {contact.nickname || `${contact.contactUser.firstName} ${contact.contactUser.lastName}`}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--mh-text-muted)' }}>
                    {contact.contactUser.jobTitle || 'Team Member'}
                  </p>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid var(--mh-border)', paddingTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <Button variant="outline" size="sm" style={{ flex: 1 }}>
                  <Mail size={16} /> Message
                </Button>
                <Button variant="outline" size="sm" style={{ flex: 1 }}>
                  <Phone size={16} /> Call
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
