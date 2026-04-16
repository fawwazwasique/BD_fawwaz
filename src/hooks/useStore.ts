import { useState, useEffect } from 'react';
import { Call, Quotation, Lead, Visit, FosTarget } from '../types';
import { isSameDay, parseISO } from 'date-fns';
import { db } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  writeBatch,
  getDocs
} from 'firebase/firestore';

export function useStore() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [targets, setTargets] = useState<FosTarget[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync with Firestore
  useEffect(() => {
    const unsubCalls = onSnapshot(query(collection(db, 'calls'), orderBy('createdAt', 'desc')), (snapshot) => {
      setCalls(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Call)));
    });

    const unsubQuotations = onSnapshot(query(collection(db, 'quotations'), orderBy('createdAt', 'desc')), (snapshot) => {
      setQuotations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quotation)));
    });

    const unsubLeads = onSnapshot(query(collection(db, 'leads'), orderBy('createdAt', 'desc')), (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead)));
    });

    const unsubVisits = onSnapshot(query(collection(db, 'visits'), orderBy('createdAt', 'desc')), (snapshot) => {
      setVisits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Visit)));
    });

    const unsubTargets = onSnapshot(query(collection(db, 'targets'), orderBy('createdAt', 'desc')), (snapshot) => {
      setTargets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FosTarget)));
    });

    setIsLoaded(true);

    return () => {
      unsubCalls();
      unsubQuotations();
      unsubLeads();
      unsubVisits();
      unsubTargets();
    };
  }, []);

  // Data Migration Logic (One-time)
  useEffect(() => {
    const runMigration = async () => {
      const hasMigrated = localStorage.getItem('firebase_migrated');
      if (hasMigrated) return;

      const savedCalls = localStorage.getItem('calltrack_calls');
      const savedQuotations = localStorage.getItem('calltrack_quotations');
      const savedLeads = localStorage.getItem('calltrack_leads');
      const savedVisits = localStorage.getItem('calltrack_visits');
      const savedTargets = localStorage.getItem('calltrack_targets');

      const batch = writeBatch(db);
      let count = 0;

      if (savedCalls) {
        const data = JSON.parse(savedCalls);
        data.forEach((item: any) => {
          const ref = doc(collection(db, 'calls'));
          batch.set(ref, { ...item, createdAt: item.createdAt || new Date().toISOString() });
          count++;
        });
      }

      if (savedQuotations) {
        const data = JSON.parse(savedQuotations);
        data.forEach((item: any) => {
          const ref = doc(collection(db, 'quotations'));
          batch.set(ref, { ...item, createdAt: item.createdAt || new Date().toISOString() });
          count++;
        });
      }

      if (savedLeads) {
        const data = JSON.parse(savedLeads);
        data.forEach((item: any) => {
          const ref = doc(collection(db, 'leads'));
          batch.set(ref, { ...item, createdAt: item.createdAt || new Date().toISOString() });
          count++;
        });
      }

      if (savedVisits) {
        const data = JSON.parse(savedVisits);
        data.forEach((item: any) => {
          const ref = doc(collection(db, 'visits'));
          batch.set(ref, { ...item, createdAt: item.createdAt || new Date().toISOString() });
          count++;
        });
      }

      if (savedTargets) {
        const data = JSON.parse(savedTargets);
        data.forEach((item: any) => {
          const ref = doc(collection(db, 'targets'));
          batch.set(ref, { ...item, createdAt: item.createdAt || new Date().toISOString() });
          count++;
        });
      }

      if (count > 0) {
        await batch.commit();
        console.log(`Migrated ${count} items to Firebase`);
      }
      localStorage.setItem('firebase_migrated', 'true');
    };

    if (isLoaded) {
      runMigration();
    }
  }, [isLoaded]);

  // Calls
  const addCall = async (call: Omit<Call, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'calls'), {
      ...call,
      createdAt: new Date().toISOString()
    });
  };
  const updateCall = async (id: string, updates: Partial<Call>) => {
    await updateDoc(doc(db, 'calls', id), updates);
  };
  const deleteCall = async (id: string) => {
    await deleteDoc(doc(db, 'calls', id));
  };

  // Quotations
  const addQuotation = async (quotation: Omit<Quotation, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'quotations'), {
      ...quotation,
      createdAt: new Date().toISOString()
    });
  };
  const updateQuotation = async (id: string, updates: Partial<Quotation>) => {
    await updateDoc(doc(db, 'quotations', id), updates);
  };
  const deleteQuotation = async (id: string) => {
    await deleteDoc(doc(db, 'quotations', id));
  };

  // Leads
  const addLead = async (lead: Omit<Lead, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'leads'), {
      ...lead,
      createdAt: new Date().toISOString()
    });
  };
  const updateLead = async (id: string, updates: Partial<Lead>) => {
    await updateDoc(doc(db, 'leads', id), updates);
  };
  const deleteLead = async (id: string) => {
    await deleteDoc(doc(db, 'leads', id));
  };

  // Visits
  const addVisit = async (visit: Omit<Visit, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'visits'), {
      ...visit,
      createdAt: new Date().toISOString()
    });
  };
  const updateVisit = async (id: string, updates: Partial<Visit>) => {
    await updateDoc(doc(db, 'visits', id), updates);
  };
  const deleteVisit = async (id: string) => {
    await deleteDoc(doc(db, 'visits', id));
  };

  // Targets
  const addTarget = async (target: Omit<FosTarget, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'targets'), {
      ...target,
      createdAt: new Date().toISOString()
    });
  };
  const updateTarget = async (id: string, updates: Partial<FosTarget>) => {
    await updateDoc(doc(db, 'targets', id), updates);
  };
  const deleteTarget = async (id: string) => {
    await deleteDoc(doc(db, 'targets', id));
  };

  const stats = {
    totalCalls: calls.length,
    todayFollowUps: calls.filter(c => c.followUpDate && isSameDay(parseISO(c.followUpDate), new Date())).length,
    meetingAppointments: calls.filter(c => c.appointmentDate && parseISO(c.appointmentDate) >= new Date()).length,
    totalQuotations: quotations.length,
    totalLeads: leads.length,
    totalVisits: visits.length,
  };

  return {
    calls, addCall, updateCall, deleteCall,
    quotations, addQuotation, updateQuotation, deleteQuotation,
    leads, addLead, updateLead, deleteLead,
    visits, addVisit, updateVisit, deleteVisit,
    targets, addTarget, updateTarget, deleteTarget,
    stats,
    isLoaded
  };
}
