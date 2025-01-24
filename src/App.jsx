import React, { useState, useEffect } from 'react';
    import FullCalendar from '@fullcalendar/react';
    import dayGridPlugin from '@fullcalendar/daygrid';
    import interactionPlugin from '@fullcalendar/interaction';
    import Select from 'react-select';
    import './App.css';
    import itLocale from '@fullcalendar/core/locales/it';

    const USE_MOCKS = true;

    function App() {
      const [events, setEvents] = useState([]);
      const [modalOpen, setModalOpen] = useState(false);
      const [selectedSlot, setSelectedSlot] = useState(null);
      const [config, setConfig] = useState(null);
      const [errorMessage, setErrorMessage] = useState('');
      const [opportunities, setOpportunities] = useState([]);
      const [selectedOpportunity, setSelectedOpportunity] = useState(null);

      useEffect(() => {
        fetchSlots();
        fetchConfig();
        fetchOpportunities();
      }, []);

        const fetchOpportunities = async () => {
        if (USE_MOCKS) {
          // Mock opportunities data
          setOpportunities([
            { value: 'opp1', label: 'Opportunità 1 - Dati Mock' },
            { value: 'opp2', label: 'Opportunità 2 - Dati Mock' },
            { value: 'opp3', label: 'Opportunità 3 - Dati Mock' },
            { value: 'opp4', label: 'Opportunità 4 - Dati Mock' },
            { value: 'opp5', label: 'Opportunità 5 - Dati Mock' },
          ]);
          return;
        }
        if (typeof ZOHO === 'undefined' || !ZOHO.CRM) {
          console.warn("ZOHO CRM API non disponibile. Questo è previsto durante lo sviluppo locale.");
          return;
        }
        try {
          const response = await ZOHO.CRM.API.getAllRecords({ Entity: "Deals" });
           if (response && response.data) {
            setOpportunities(response.data.map(deal => ({value: deal.id, label: deal.Name})));
          }
        } catch (error) {
          console.error("Errore nel recupero delle opportunità:", error);
        }
      };


      const fetchSlots = async () => {
        if (USE_MOCKS) {
          // Mock data for testing
          const mockSlots = [
            { id: '1', Service_Type: 'Newsletter', Date: '2024-07-01', Status: 'Booked', Target: 'National' },
            { id: '2', Service_Type: 'DEM', Date: '2024-07-05', Status: 'Available', Target: 'Custom' },
            { id: '3', Service_Type: 'Newsletter', Date: '2024-07-10', Status: 'Booked', Target: 'National' },
            { id: '4', Service_Type: 'Push', Date: '2024-07-12', Status: 'Booked', Target: 'National' },
          ];
          const formattedEvents = mockSlots.map(slot => ({
            id: slot.id,
            title: slot.Service_Type,
            start: slot.Date,
             allDay: true,
            extendedProps: {
              target: slot.Target,
              status: slot.Status,
              backgroundColor: slot.Service_Type === 'Push' ? '#3082B7' : slot.Service_Type === 'Newsletter' ? '#60CFE1' : '#E50F00'
            }
          }));
          setEvents(formattedEvents);
          return;
        }
        if (typeof ZOHO === 'undefined' || !ZOHO.CRM) {
          console.warn("ZOHO CRM API non disponibile. Questo è previsto durante lo sviluppo locale.");
          return;
        }
        try {
          const response = await ZOHO.CRM.API.getAllRecords({ Entity: "Bookings" });
          if (response && response.data) {
            const formattedEvents = response.data.map(slot => ({
              id: slot.id,
              title: slot.Service_Type,
              start: slot.Date,
               allDay: true,
              extendedProps: {
                target: slot.Target,
                status: slot.Status,
                backgroundColor: slot.Service_Type === 'Push' ? '#3082B7' : slot.Service_Type === 'Newsletter' ? '#60CFE1' : '#E50F00'
              }
            }));
            setEvents(formattedEvents);
          }
        } catch (error) {
          console.error("Errore nel recupero degli slot:", error);
        }
      };

      const fetchConfig = async () => {
        if (USE_MOCKS) {
          // Mock config data
          setConfig({
            rules: {
              newsletter: {
                maxBrands: 2
              }
            }
          });
          return;
        }
        if (typeof ZOHO === 'undefined' || !ZOHO.CRM) {
          console.warn("ZOHO CRM API non disponibile. Questo è previsto durante lo sviluppo locale.");
          return;
        }
        try {
          const response = await ZOHO.CRM.API.getAllRecords({ Entity: "ConfigRules" });
          if (response && response.data && response.data.length > 0) {
            setConfig(JSON.parse(response.data[0].ConfigJSON));
          } else {
            console.error("Nessuna configurazione trovata.");
          }
        } catch (error) {
          console.error("Errore nel recupero della configurazione:", error);
        }
      };

      const handleDateClick = (arg) => {
        setSelectedSlot({ start: arg.dateStr });
        setModalOpen(true);
        setErrorMessage('');
      };

      const handleEventClick = (clickInfo) => {
        setSelectedSlot({
          id: clickInfo.event.id,
          start: clickInfo.event.startStr,
          serviceType: clickInfo.event.title,
          target: clickInfo.event.extendedProps.target,
          status: clickInfo.event.extendedProps.status
        });
        setModalOpen(true);
        setErrorMessage('');
      };

      const closeModal = () => {
        setModalOpen(false);
        setSelectedSlot(null);
        setErrorMessage('');
        setSelectedOpportunity(null);
      };

      const handleSubmit = async (event) => {
        event.preventDefault();
        const serviceType = document.getElementById('service-type').value;
        const date = document.getElementById('date').value;
        const target = document.getElementById('target').value;
        const opportunityId = selectedOpportunity?.value;


        const slotData = {
          serviceType,
          date,
          target,
          opportunityId
        };

        const isValid = await validateBooking(slotData);
         if (!isValid) {
          return;
        }

        if (USE_MOCKS) {
          // Mock booking logic
          const newEvent = {
            id: selectedSlot?.id || String(Math.random()),
            title: serviceType,
            start: date,
            allDay: true,
            extendedProps: {
              target: target,
              status: "Booked",
              backgroundColor: serviceType === 'Push' ? '#3082B7' : serviceType === 'Newsletter' ? '#60CFE1' : '#E50F00'
            }
          };
          setEvents(prevEvents => {
            const updatedEvents = selectedSlot?.id ? prevEvents.map(e => e.id === selectedSlot.id ? newEvent : e) : [...prevEvents, newEvent];
            return updatedEvents;
          });
          closeModal();
          return;
        }

        if (typeof ZOHO === 'undefined' || !ZOHO.CRM) {
          console.warn("ZOHO CRM API non disponibile. Questo è previsto durante lo sviluppo locale.");
          closeModal();
          return;
        }

        try {
          if (selectedSlot && selectedSlot.id) {
            await ZOHO.CRM.API.updateRecord({
              Entity: "Bookings",
              APIData: {
                id: selectedSlot.id,
                Service_Type: serviceType,
                Date: date,
                Target: target,
                Status: "Booked",
                Opportunity: opportunityId
              }
            });
          } else {
            await ZOHO.CRM.API.insertRecord({
              Entity: "Bookings",
              APIData: {
                Service_Type: serviceType,
                Date: date,
                Target: target,
                Status: "Booked",
                Opportunity: opportunityId
              }
            });
          }
          fetchSlots();
          closeModal();
        } catch (error) {
          console.error("Errore nella prenotazione dello slot:", error);
        }
      };

      const validateBooking = async (slotData) => {
        if (!config || !config.rules) {
          console.error("Regole di configurazione non caricate.");
          return true;
        }

        const maxBrands = config.rules.newsletter?.maxBrands || 0;
        const maxTotalBookings = 2;
        const maxPushes = 2;

        if (USE_MOCKS) {
          const mockBookings = events.filter(e => e.start === slotData.date && e.title !== "Push");
          if (mockBookings.length >= maxTotalBookings && slotData.serviceType !== "Push") {
             setErrorMessage(`Massimo ${maxTotalBookings} prenotazioni (esclusi i push) consentite per questa data.`);
            return false;
          }
          if (slotData.serviceType === "Newsletter" && maxBrands > 0) {
            const mockNewsletterBookings = events.filter(e => e.start === slotData.date && e.title === "Newsletter");
            if (mockNewsletterBookings.length >= maxBrands) {
              setErrorMessage(`Massimo ${maxBrands} marchi consentiti per questa data.`);
              return false;
            }
          }
          if (slotData.serviceType === "Push") {
            const mockPushBookings = events.filter(e => e.start === slotData.date && e.title === "Push");
             if (mockPushBookings.length >= maxPushes) {
              setErrorMessage(`Massimo ${maxPushes} push consentiti per questa data.`);
              return false;
            }
          }
          setErrorMessage('');
          return true;
        }

        if (typeof ZOHO === 'undefined' || !ZOHO.CRM) {
          console.warn("ZOHO CRM API non disponibile. Questo è previsto durante lo sviluppo locale.");
          return true;
        }

        try {
          const response = await ZOHO.CRM.API.searchRecord({
            Entity: "Bookings",
            Type: "criteria",
            Query: `(Date:${slotData.date})`
          });

          if (response && response.data) {
            const bookingsOnDate = response.data;
            const nonPushBookings = bookingsOnDate.filter(booking => booking.Service_Type !== "Push");
            if (nonPushBookings.length >= maxTotalBookings && slotData.serviceType !== "Push") {
              setErrorMessage(`Massimo ${maxTotalBookings} prenotazioni (esclusi i push) consentite per questa data.`);
              return false;
            }

            if (slotData.serviceType === "Newsletter" && maxBrands > 0) {
              let totalBrands = 0;
              for (const booking of bookingsOnDate) {
                if (booking.Service_Type === "Newsletter") {
                  const relatedBrands = await ZOHO.CRM.API.getRelatedRecords({
                    Entity: "Bookings",
                    RecordID: booking.id,
                    RelatedList: "Brands"
                  });
                  if (relatedBrands && relatedBrands.data) {
                    totalBrands += relatedBrands.data.length;
                  }
                }
              }
              if (totalBrands >= maxBrands) {
                setErrorMessage(`Massimo ${maxBrands} marchi consentiti per questa data.`);
                return false;
              }
            }
            if (slotData.serviceType === "Push") {
              const pushBookings = bookingsOnDate.filter(booking => booking.Service_Type === "Push");
              if (pushBookings.length >= maxPushes) {
                setErrorMessage(`Massimo ${maxPushes} push consentiti per questa data.`);
                return false;
              }
            }
          }
        } catch (error) {
          console.error("Errore nel recupero delle prenotazioni:", error);
          return false;
        }
        setErrorMessage('');
        return true;
      };

      const handleDelete = async () => {
        if (!selectedSlot || !selectedSlot.id) {
          console.error("Nessuno slot selezionato per l'eliminazione.");
          return;
        }

        if (USE_MOCKS) {
          setEvents(prevEvents => prevEvents.filter(e => e.id !== selectedSlot.id));
          closeModal();
          return;
        }

        if (typeof ZOHO === 'undefined' || !ZOHO.CRM) {
          console.warn("ZOHO CRM API non disponibile. Questo è previsto durante lo sviluppo locale.");
          closeModal();
          return;
        }

        try {
          await ZOHO.CRM.API.deleteRecord({ Entity: "Bookings", RecordID: selectedSlot.id });
          fetchSlots();
          closeModal();
        } catch (error) {
          console.error("Errore nell'eliminazione dello slot:", error);
        }
      };

      return (
        <div className="container">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            height={600}
            locale={itLocale}
            eventContent={(arg) => (
              <div style={{ backgroundColor: arg.event.extendedProps.backgroundColor, padding: '2px', borderRadius: '4px', color: 'white' }}>
                {arg.event.title}
              </div>
            )}
          />

          {modalOpen && (
            <div className="modal" style={{ display: modalOpen ? 'block' : 'none' }}>
              <div className="modal-content">
              <span className="close" style={{ float: 'right' }} onClick={closeModal}>&times;</span>
                <h2>{selectedSlot && selectedSlot.id ? 'Modifica Prenotazione' : 'Prenota uno Slot'}</h2>
                <form id="booking-form" onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="service-type" className="form-label">Tipo di Servizio</label>
                    <select id="service-type" className="form-select" defaultValue={selectedSlot?.serviceType || "Newsletter"} required>
                      <option value="Newsletter">Newsletter</option>
                      <option value="DEM">DEM</option>
                      <option value="Push">Push</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="date" className="form-label">Data</label>
                    <input type="date" id="date" className="form-control" defaultValue={selectedSlot?.start} required />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="target" className="form-label">Target</label>
                    <select id="target" className="form-select" defaultValue={selectedSlot?.target || "National"} required>
                      <option value="National">Nazionale</option>
                      <option value="Custom">Personalizzato</option>
                    </select>
                  </div>
                   <div className="mb-3">
                    <label htmlFor="opportunity" className="form-label">Opportunità</label>
                     <Select
                        id="opportunity"
                        className="form-select"
                        options={opportunities}
                        value={selectedOpportunity}
                        onChange={setSelectedOpportunity}
                        placeholder="Seleziona un'Opportunità"
                        isSearchable
                        styles={{
                          control: (baseStyles, state) => ({
                            ...baseStyles,
                            border: state.isFocused ? 'none' : 'none',
                            boxShadow: state.isFocused ? 'none' : 'none',
                            '&:hover': {
                              border: 'none',
                            },
                          }),
                          indicatorSeparator: (baseStyles) => ({
                            ...baseStyles,
                            display: 'none',
                          }),
                          dropdownIndicator: (baseStyles) => ({
                            ...baseStyles,
                            display: 'none',
                          }),
                          menu: (baseStyles) => ({
                            ...baseStyles,
                            zIndex: 100
                          })
                        }}
                      />
                  </div>
                  <div className="d-flex justify-content-end">
                  <button type="submit" className="btn btn-primary">
                    {selectedSlot && selectedSlot.id ? 'Aggiorna Slot' : 'Prenota Slot'}
                  </button>
                  </div>
                  {errorMessage && <div className="error-message">{errorMessage}</div>}
                </form>
                {selectedSlot && selectedSlot.id && (
                  <button
                    onClick={handleDelete}
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      color: 'red',
                      backgroundColor: 'transparent',
                      border: 'none',
                      padding: '5px 10px',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease',
                    }}
                    onMouseOver={(e) => (e.target.style.backgroundColor = 'rgba(255, 0, 0, 0.1)')}
                    onMouseOut={(e) => (e.target.style.backgroundColor = 'transparent')}
                  >
                    Elimina
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    export default App;
