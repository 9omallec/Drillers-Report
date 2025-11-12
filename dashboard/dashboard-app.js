        const { useState, useEffect } = React;

        function BossDashboard() {
            // Initialize shared storage service
            const storageService = new window.StorageService();

            const [reports, setReports] = useState(() =>
                storageService.loadGlobal('bossReports', [])
            );
            const [selectedReports, setSelectedReports] = useState([]);
            const [filterStatus, setFilterStatus] = useState('all');
            const [searchTerm, setSearchTerm] = useState('');
            const [viewingReport, setViewingReport] = useState(null);
            const [showAnalytics, setShowAnalytics] = useState(false);
            const [viewingImages, setViewingImages] = useState(null);
            const [currentImageIndex, setCurrentImageIndex] = useState(0);

            // Use shared dark mode hook
            const [darkMode, setDarkMode] = window.useDarkMode();

            // Save reports whenever they change
            useEffect(() => {
                storageService.saveGlobal('bossReports', reports);
            }, [reports]);

            // ====== GOOGLE DRIVE API INTEGRATION (Shared Hook) ======
            const {
                isSignedIn,
                driveStatus,
                signIn: signInToDrive,
                signOut: signOutFromDrive,
                listFiles,
                downloadFile
            } = window.useGoogleDrive(window.GOOGLE_DRIVE_CONFIG.SCOPES_READONLY);

            // Sync reports from Google Drive using shared hook
            const syncFromDrive = async () => {
                try {
                    if (!isSignedIn) {
                        alert('⚠️ Please sign in to Google Drive first');
                        return;
                    }

                    // Use default query which includes folder ID and mimeType filter
                    const files = await listFiles();

                    if (!files || files.length === 0) {
                        alert('No reports found in Drive folder');
                        return;
                    }

                    let importedCount = 0;

                    for (const file of files) {
                        // Check if already imported
                        const alreadyImported = reports.some(r => r.driveFileId === file.id);
                        if (alreadyImported) continue;

                        // Download and parse file using shared hook
                        const data = await downloadFile(file.id);

                        const newReport = {
                            id: Date.now() + importedCount,
                            importedAt: file.createdTime,
                            status: 'pending',
                            driveFileId: file.id,
                            driveFileName: file.name,
                            ...data.report,
                            workDays: data.workDays,
                            borings: data.borings,
                            equipment: data.equipment,
                            supplies: data.supplies
                        };

                        setReports(prev => [newReport, ...prev]);
                        importedCount++;
                    }

                    if (importedCount > 0) {
                        alert(`✓ Imported ${importedCount} new report(s) from Drive!`);
                    } else {
                        alert('All reports already imported');
                    }

                } catch (error) {
                    console.error('Error syncing from Drive:', error);
                    alert('Error syncing from Google Drive');
                }
            };
            // ====== END GOOGLE DRIVE API ======

            // Import report from JSON file (emailed by driller)
            const handleImportReport = (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const data = JSON.parse(e.target.result);
                            const newReport = {
                                id: Date.now(),
                                importedAt: new Date().toISOString(),
                                status: 'pending',
                                ...data.report,
                                workDays: data.workDays,
                                borings: data.borings,
                                equipment: data.equipment,
                                supplies: data.supplies
                            };
                            setReports([newReport, ...reports]);
                            alert('Report imported successfully!');
                        } catch (error) {
                            alert('Error importing report. Please ensure it\'s a valid report file.');
                        }
                    };
                    reader.readAsText(file);
                }
            };

            // Approve a report
            const approveReport = (id) => {
                setReports(reports.map(r => 
                    r.id === id ? { ...r, status: 'approved', approvedAt: new Date().toISOString() } : r
                ));
            };

            // Request changes on a report
            const requestChanges = (id) => {
                const reason = prompt('What changes are needed?');
                if (reason) {
                    setReports(reports.map(r => 
                        r.id === id ? { ...r, status: 'changes_requested', changeReason: reason } : r
                    ));
                }
            };

            // Delete a report
            const deleteReport = (id) => {
                if (confirm('Are you sure you want to delete this report?')) {
                    setReports(reports.filter(r => r.id !== id));
                }
            };

            // Export selected reports to CSV for QuickBooks Desktop
            const exportToQuickBooks = () => {
                if (selectedReports.length === 0) {
                    alert('Please select reports to export');
                    return;
                }

                // QuickBooks Desktop optimized format with more detailed breakdown
                let csv = 'Date,Customer,Service Item,Description,Quantity,Rate,Amount,Employee,Job Name,Location,Notes\n';
                
                selectedReports.forEach(id => {
                    const report = reports.find(r => r.id === id);
                    if (report) {
                        const date = report.importedAt?.split('T')[0] || '';
                        const customer = report.customer || '';
                        const jobName = report.jobName || '';
                        const location = report.location || '';
                        const driller = report.driller || '';
                        
                        // Calculate totals
                        const totalDrive = report.workDays?.reduce((sum, day) => sum + (parseFloat(day.hoursDriving) || 0), 0) || 0;
                        const totalOnSite = report.workDays?.reduce((sum, day) => sum + (parseFloat(day.hoursOnSite) || 0), 0) || 0;
                        const totalStandby = report.workDays?.reduce((sum, day) => {
                            const hours = parseFloat(day.standbyHours) || 0;
                            const minutes = parseFloat(day.standbyMinutes) || 0;
                            return sum + hours + (minutes / 60);
                        }, 0) || 0;
                        const totalFootage = report.borings?.reduce((sum, b) => sum + (parseFloat(b.footage) || 0), 0) || 0;
                        const numBorings = report.borings?.filter(b => parseFloat(b.footage) > 0).length || 0;
                        
                        // Create separate line items for different service types (better for QuickBooks)
                        if (totalDrive > 0) {
                            csv += `"${date}","${customer}","Drive Time","Drilling - Drive Time",${totalDrive.toFixed(2)},,"","${driller}","${jobName}","${location}","${totalDrive.toFixed(2)} hours"\n`;
                        }
                        if (totalOnSite > 0) {
                            csv += `"${date}","${customer}","On-Site Time","Drilling - On-Site Work",${totalOnSite.toFixed(2)},,"","${driller}","${jobName}","${location}","${totalOnSite.toFixed(2)} hours | ${numBorings} borings | ${totalFootage.toFixed(1)} ft"\n`;
                        }
                        if (totalStandby > 0) {
                            csv += `"${date}","${customer}","Standby Time","Standby/Waiting",${totalStandby.toFixed(2)},,"","${driller}","${jobName}","${location}","${totalStandby.toFixed(2)} hours standby"\n`;
                        }
                        if (totalFootage > 0) {
                            csv += `"${date}","${customer}","Drilling Footage","Drilling Services",${totalFootage.toFixed(1)},,"","${driller}","${jobName}","${location}","${numBorings} borings totaling ${totalFootage.toFixed(1)} feet"\n`;
                        }
                    }
                });

                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `QuickBooks-Desktop-Export-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                
                alert('Export complete! Import this CSV into QuickBooks Desktop:\n\n1. File → Utilities → Import → Excel Files\n2. Select the downloaded CSV\n3. Map columns as needed\n4. Import and review invoices');
            };

            // Filter and search reports
            const filteredReports = reports.filter(report => {
                const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
                const matchesSearch = searchTerm === '' || 
                    report.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    report.jobName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    report.driller?.toLowerCase().includes(searchTerm.toLowerCase());
                return matchesStatus && matchesSearch;
            });

            // Calculate summary statistics
            const stats = {
                total: reports.length,
                pending: reports.filter(r => r.status === 'pending').length,
                approved: reports.filter(r => r.status === 'approved').length,
                changesRequested: reports.filter(r => r.status === 'changes_requested').length,
                totalHours: reports.reduce((sum, r) => {
                    const drive = r.workDays?.reduce((s, d) => s + (parseFloat(d.hoursDriving) || 0), 0) || 0;
                    const onSite = r.workDays?.reduce((s, d) => s + (parseFloat(d.hoursOnSite) || 0), 0) || 0;
                    return sum + drive + onSite;
                }, 0).toFixed(1),
                totalFootage: reports.reduce((sum, r) => {
                    return sum + (r.borings?.reduce((s, b) => s + (parseFloat(b.footage) || 0), 0) || 0);
                }, 0).toFixed(1)
            };

            return (
                <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
                    <div className="max-w-7xl mx-auto p-4">
                        {/* Header */}
                        <div className={`rounded-xl p-6 mb-6 shadow-xl ${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-white to-gray-50'}`} style={{borderTop: '4px solid #16a34a'}}>
                            <div className="flex justify-between items-center flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <img src="data:image/webp;base64,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" alt="O'Malley Drilling" className={`w-12 h-12 object-contain rounded-lg ${darkMode ? "bg-gray-800 p-2" : "bg-white p-1"}`} style={{filter: darkMode ? 'brightness(0) invert(1)' : 'none'}} className="app-logo" alt="Company Logo" />
                                    <div>
                                        <h1 className={`text-3xl md:text-4xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                            📊 Drillers Report Dashboard
                                        </h1>
                                    <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        O'Malley Drilling Inv. - Report Management
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3 header-buttons">
                                    <button
                                        onClick={() => setShowAnalytics(true)}
                                        className={`px-5 py-2.5 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                                    >
                                        📈 Analytics
                                    </button>
                                    <button
                                        onClick={() => setDarkMode(!darkMode)}
                                        className={`px-4 py-2.5 rounded-lg font-semibold transition-all ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                    >
                                        {darkMode ? '☀️ Light' : '🌙 Dark'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                            <div className={`rounded-xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg hover:shadow-xl transition-shadow`}>
                                <div className={`text-3xl font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{stats.total}</div>
                                <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Reports</div>
                            </div>
                            <div className={`rounded-xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg hover:shadow-xl transition-shadow`}>
                                <div className="text-3xl font-bold text-yellow-500">{stats.pending}</div>
                                <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending</div>
                            </div>
                            <div className={`rounded-xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg hover:shadow-xl transition-shadow`}>
                                <div className="text-3xl font-bold text-green-500">{stats.approved}</div>
                                <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Approved</div>
                            </div>
                            <div className={`rounded-xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg hover:shadow-xl transition-shadow`}>
                                <div className="text-3xl font-bold text-blue-500">{stats.totalHours}</div>
                                <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Hours</div>
                            </div>
                            <div className={`rounded-xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg hover:shadow-xl transition-shadow`}>
                                <div className="text-3xl font-bold text-purple-500">{stats.totalFootage} ft</div>
                                <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Footage</div>
                            </div>
                        </div>

                        {/* Actions Bar */}
                        <div className={`rounded-xl p-5 mb-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className="flex flex-col md:flex-row gap-3 items-center">
                                <button
                                    onClick={() => window.open(`https://drive.google.com/drive/folders/${GOOGLE_DRIVE_CONFIG.FOLDER_ID}`, '_blank')}
                                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg hover:shadow-lg font-semibold transition-all"
                                >
                                    📁 Open Drive Folder
                                </button>
                                {!isSignedIn ? (
                                    <button
                                        onClick={signInToDrive}
                                        className="px-5 py-2.5 rounded-lg font-semibold transition-all bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:shadow-lg"
                                    >
                                        🔐 Sign in to Drive
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={syncFromDrive}
                                            className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg hover:shadow-lg font-semibold transition-all"
                                        >
                                            ♻️ Sync from Drive
                                        </button>
                                        <button
                                            onClick={signOutFromDrive}
                                            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg transition-all"
                                        >
                                            Sign Out
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={exportToQuickBooks}
                                    className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
                                        selectedReports.length === 0 
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white hover:shadow-lg'
                                    }`}
                                    disabled={selectedReports.length === 0}
                                >
                                    💰 Export to QuickBooks ({selectedReports.length})
                                </button>
                                {/* Manual Import - Backup Option (Less Prominent) */}
                                <label className={`px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition-all ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} title="Manual import (backup option if Drive sync fails)">
                                    📥 Manual Import
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleImportReport}
                                        className="hidden"
                                    />
                                </label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className={`px-4 py-2.5 border rounded-lg font-medium transition-all ${darkMode ? 'bg-gray-700 text-white border-gray-600 hover:border-gray-500' : 'bg-white border-gray-300 hover:border-gray-400'}`}
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="changes_requested">Changes Requested</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="🔍 Search customer, job, or driller..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={`flex-1 px-4 py-2.5 border rounded-lg transition-all ${darkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400 focus:border-green-500' : 'bg-white border-gray-300 focus:border-green-500'}`}
                                />
                            </div>
                            {/* Google Drive Status Message */}
                            {driveStatus && (
                                <div className={`mt-3 p-3 rounded-lg text-center font-medium ${
                                    driveStatus.includes('✓') || driveStatus.includes('Success') || driveStatus.includes('Imported')
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                        : driveStatus.includes('Error') 
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                }`}>
                                    {driveStatus}
                                </div>
                            )}
                        </div>

                        {/* Reports Table */}
                        <div className={`rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            {filteredReports.length === 0 ? (
                                <div className="p-8 text-center">
                                    <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {reports.length === 0 
                                            ? isSignedIn 
                                                ? 'No reports yet. Click "♻️ Sync from Drive" to load reports, or have drillers submit new reports.'
                                                : 'No reports yet. Click "🔐 Sign in to Drive" above to automatically sync reports from Google Drive.'
                                            : 'No reports match your search criteria.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                                            <tr>
                                                <th className="px-4 py-3 text-left">
                                                    <input
                                                        type="checkbox"
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedReports(filteredReports.map(r => r.id));
                                                            } else {
                                                                setSelectedReports([]);
                                                            }
                                                        }}
                                                    />
                                                </th>
                                                <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Date</th>
                                                <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Customer</th>
                                                <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Job</th>
                                                <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Driller</th>
                                                <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Hours</th>
                                                <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Footage</th>
                                                <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Status</th>
                                                <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filteredReports.map(report => {
                                                const totalHours = (report.workDays?.reduce((sum, day) => {
                                                    const drive = parseFloat(day.hoursDriving) || 0;
                                                    const onSite = parseFloat(day.hoursOnSite) || 0;
                                                    return sum + drive + onSite;
                                                }, 0) || 0).toFixed(1);
                                                const totalFootage = (report.borings?.reduce((sum, b) => sum + (parseFloat(b.footage) || 0), 0) || 0).toFixed(1);
                                                
                                                return (
                                                    <tr key={report.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedReports.includes(report.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedReports([...selectedReports, report.id]);
                                                                    } else {
                                                                        setSelectedReports(selectedReports.filter(id => id !== report.id));
                                                                    }
                                                                }}
                                                            />
                                                        </td>
                                                        <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            {report.importedAt?.split('T')[0] || 'N/A'}
                                                        </td>
                                                        <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            {report.customer || 'N/A'}
                                                        </td>
                                                        <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            {report.jobName || 'N/A'}
                                                        </td>
                                                        <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            {report.driller || 'N/A'}
                                                        </td>
                                                        <td className={`px-4 py-3 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            {totalHours}
                                                        </td>
                                                        <td className={`px-4 py-3 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            {totalFootage} ft
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                                report.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                                report.status === 'changes_requested' ? 'bg-red-100 text-red-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                                {report.status === 'approved' ? '✓ Approved' :
                                                                 report.status === 'changes_requested' ? '⚠ Changes Needed' :
                                                                 '⏳ Pending'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        // Reconstruct report data structure for Report app
                                                                        const reportData = {
                                                                            report: {
                                                                                client: report.client,
                                                                                jobName: report.jobName,
                                                                                location: report.location,
                                                                                driller: report.driller,
                                                                                helper: report.helper,
                                                                                perDiem: report.perDiem,
                                                                                commentsLabor: report.commentsLabor,
                                                                                uploadedPhotosDetails: report.uploadedPhotosDetails || []
                                                                            },
                                                                            workDays: report.workDays || [],
                                                                            borings: report.borings || [],
                                                                            equipment: report.equipment || {},
                                                                            supplies: report.supplies || {}
                                                                        };

                                                                        // Store report data for Report app to read
                                                                        localStorage.setItem('editingReport', JSON.stringify({
                                                                            reportData: reportData,
                                                                            driveFileId: report.driveFileId,
                                                                            driveFileName: report.driveFileName,
                                                                            mode: 'edit'
                                                                        }));

                                                                        // Open Report app in named window (reuses same tab for all edits)
                                                                        window.open('../report/index.html?mode=edit', 'reportEditor');
                                                                    }}
                                                                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                                                    title="Edit Report"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                {report.uploadedPhotosDetails && report.uploadedPhotosDetails.length > 0 && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setViewingImages(report.uploadedPhotosDetails);
                                                                            setCurrentImageIndex(0);
                                                                        }}
                                                                        className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                                                                        title={`View ${report.uploadedPhotosDetails.length} image(s)`}
                                                                    >
                                                                        🖼️
                                                                    </button>
                                                                )}
                                                                {report.status === 'pending' ? (
                                                                    <button
                                                                        onClick={() => approveReport(report.id)}
                                                                        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                                                        title="Approve"
                                                                    >
                                                                        ✓
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => setReports(reports.map(r => r.id === report.id ? { ...r, status: 'pending' } : r))}
                                                                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                                                        title="Reset to Pending"
                                                                    >
                                                                        ↺
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => deleteReport(report.id)}
                                                                    className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                                                    title="Delete"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Quick Guide */}
                        <div className={`rounded-lg p-4 mt-6 ${darkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
                            <h3 className={`text-lg font-bold mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>
                                📋 Quick Guide
                            </h3>
                            <ol className={`list-decimal list-inside space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <li><strong>Sign in to Google Drive</strong> (top right) - reports automatically sync!</li>
                                <li>Click the 👁 eye icon to view any report</li>
                                <li>Click "✓" to approve or "✎" to request changes</li>
                                <li>Export approved reports to QuickBooks for billing</li>
                            </ol>
                            <p className={`mt-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                💡 Backup: Use "Import Report" if you need to manually upload a JSON file
                            </p>
                        </div>
                        </div>
                    </div>
                    
                    {/* Full Report View Modal */}
                    {viewingReport && (
                        <div 
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                            onClick={() => setViewingReport(null)}
                        >
                            <div 
                                className={`w-full max-w-7xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                    <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        📋 {viewingReport.jobName || 'Drill Report'}
                                    </h2>
                                    <button
                                        onClick={() => setViewingReport(null)}
                                        className="text-3xl font-bold text-gray-500 hover:text-gray-700"
                                    >
                                        ×
                                    </button>
                                </div>
                                
                                {/* Report Content - Matching Driller App Layout */}
                                <div className="p-6">
                                    {/* Job Details Section */}
                                    <div className={`rounded-lg p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-brand-green-400' : 'text-brand-green-600'}`}>
                                            📝 Job Details
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Customer</label>
                                                <div className={`p-3 rounded ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
                                                    {viewingReport.customer || 'N/A'}
                                                </div>
                                            </div>
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Job Name / Number</label>
                                                <div className={`p-3 rounded ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
                                                    {viewingReport.jobName || 'N/A'}
                                                </div>
                                            </div>
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Location</label>
                                                <div className={`p-3 rounded ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
                                                    {viewingReport.location || 'N/A'}
                                                </div>
                                            </div>
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Driller</label>
                                                <div className={`p-3 rounded ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
                                                    {viewingReport.driller || 'N/A'}
                                                </div>
                                            </div>
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Helper</label>
                                                <div className={`p-3 rounded ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
                                                    {viewingReport.helper || 'N/A'}
                                                </div>
                                            </div>
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Per Diem (nights)</label>
                                                <div className={`p-3 rounded ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
                                                    {viewingReport.perDiem || '0'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Work Hours Section */}
                                    <div className={`rounded-lg p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-brand-green-400' : 'text-brand-green-600'}`}>
                                            ⏰ Work Hours
                                        </h3>
                                        {viewingReport.workDays && viewingReport.workDays.length > 0 ? (
                                            <div className="space-y-4">
                                                {viewingReport.workDays.map((day, index) => {
                                                    const drive = parseFloat(day.hoursDriving) || 0;
                                                    const onSite = parseFloat(day.hoursOnSite) || 0;
                                                    const standby = (parseFloat(day.standbyHours) || 0) + ((parseFloat(day.standbyMinutes) || 0) / 60);
                                                    const dayTotal = drive + onSite + standby;
                                                    
                                                    if (dayTotal === 0) return null;
                                                    
                                                    return (
                                                        <div key={index} className={`p-4 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                                            <div className="font-bold mb-3">Day {index + 1} - {day.date || 'N/A'}</div>
                                                            
                                                            {/* Exact Times Section */}
                                                            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-500">
                                                                <div className="text-sm font-semibold mb-2 text-blue-700 dark:text-blue-300">⏰ Exact Times:</div>
                                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                                    {day.timeLeftShop && (
                                                                        <div>
                                                                            <span className="text-gray-600 dark:text-gray-400">Left Shop:</span>
                                                                            <strong className="ml-1">{day.timeLeftShop}</strong>
                                                                        </div>
                                                                    )}
                                                                    {day.arrivedOnSite && (
                                                                        <div>
                                                                            <span className="text-gray-600 dark:text-gray-400">Arrived Site:</span>
                                                                            <strong className="ml-1">{day.arrivedOnSite}</strong>
                                                                        </div>
                                                                    )}
                                                                    {day.timeLeftSite && (
                                                                        <div>
                                                                            <span className="text-gray-600 dark:text-gray-400">Left Site:</span>
                                                                            <strong className="ml-1">{day.timeLeftSite}</strong>
                                                                        </div>
                                                                    )}
                                                                    {day.arrivedAtShop && (
                                                                        <div>
                                                                            <span className="text-gray-600 dark:text-gray-400">Arrived Shop:</span>
                                                                            <strong className="ml-1">{day.arrivedAtShop}</strong>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Hour Totals */}
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                                <div>
                                                                    <span className="text-gray-500">Driving:</span> <strong>{drive.toFixed(2)} hrs</strong>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-500">On-Site:</span> <strong>{onSite.toFixed(2)} hrs</strong>
                                                                </div>
                                                                {standby > 0 && (
                                                                    <div>
                                                                        <span className="text-gray-500">Standby:</span> <strong>{standby.toFixed(2)} hrs</strong>
                                                                        {day.standbyReason && <div className="text-xs text-gray-500">({day.standbyReason})</div>}
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <span className="text-gray-500">Total:</span> <strong className="text-brand-green-600">{dayTotal.toFixed(2)} hrs</strong>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">No work hours recorded</p>
                                        )}
                                    </div>

                                    {/* Equipment Section */}
                                    <div className={`rounded-lg p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-brand-green-400' : 'text-brand-green-600'}`}>
                                            🚜 Equipment Used
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {viewingReport.equipment?.drillRig && (
                                                <div className={`p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                                    <div className="text-sm text-gray-500">Drill Rig</div>
                                                    <div className="font-semibold">{viewingReport.equipment.drillRig}</div>
                                                </div>
                                            )}
                                            {viewingReport.equipment?.truck && (
                                                <div className={`p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                                    <div className="text-sm text-gray-500">Truck</div>
                                                    <div className="font-semibold">{viewingReport.equipment.truck}</div>
                                                </div>
                                            )}
                                            {viewingReport.equipment?.trailer && (
                                                <div className={`p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                                    <div className="text-sm text-gray-500">Trailer</div>
                                                    <div className="font-semibold">{viewingReport.equipment.trailer}</div>
                                                </div>
                                            )}
                                            {viewingReport.equipment?.dumpTruck === 'Yes' && (
                                                <div className={`p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                                    <div className="text-sm text-gray-500">Dump Truck</div>
                                                    <div className="font-semibold">Yes {viewingReport.equipment.dumpTruckTimes ? `(${viewingReport.equipment.dumpTruckTimes}x)` : ''}</div>
                                                </div>
                                            )}
                                            {viewingReport.equipment?.coreMachine && (
                                                <div className={`p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                                    <div className="text-sm text-gray-500">Core Machine</div>
                                                    <div className="font-semibold">✓ Yes</div>
                                                </div>
                                            )}
                                            {viewingReport.equipment?.groutMachine && (
                                                <div className={`p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                                    <div className="text-sm text-gray-500">Grout Machine</div>
                                                    <div className="font-semibold">✓ Yes</div>
                                                </div>
                                            )}
                                            {viewingReport.equipment?.extruder && (
                                                <div className={`p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                                    <div className="text-sm text-gray-500">Extruder</div>
                                                    <div className="font-semibold">✓ Yes</div>
                                                </div>
                                            )}
                                            {viewingReport.equipment?.generator && (
                                                <div className={`p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                                    <div className="text-sm text-gray-500">Generator</div>
                                                    <div className="font-semibold">✓ Yes</div>
                                                </div>
                                            )}
                                            {viewingReport.equipment?.decon && (
                                                <div className={`p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                                    <div className="text-sm text-gray-500">Decon</div>
                                                    <div className="font-semibold">✓ Yes</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Borings Section */}
                                    <div className={`rounded-lg p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-brand-green-400' : 'text-brand-green-600'}`}>
                                            🕳️ Borings
                                        </h3>
                                        {viewingReport.borings && viewingReport.borings.length > 0 ? (
                                            <div className="space-y-3">
                                                {viewingReport.borings.map((boring, index) => {
                                                    if (!boring.footage || parseFloat(boring.footage) === 0) return null;
                                                    return (
                                                        <div key={index} className={`p-4 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="font-bold text-lg">B-{index + 1}</span>
                                                                <span className="text-brand-green-600 font-bold">{boring.footage} ft</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                                {boring.method && (
                                                                    <div>
                                                                        <span className="text-gray-500">Method:</span> <strong>{boring.method}</strong>
                                                                    </div>
                                                                )}
                                                                {boring.sampleType && (
                                                                    <div>
                                                                        <span className="text-gray-500">Sample:</span> <strong>{boring.sampleType}</strong>
                                                                    </div>
                                                                )}
                                                                {boring.isEnvironmental && (
                                                                    <div className="text-blue-600">✓ Environmental</div>
                                                                )}
                                                                {boring.isGeotechnical && (
                                                                    <div className="text-purple-600">✓ Geotechnical</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">No borings recorded</p>
                                        )}
                                    </div>

                                    {/* Supplies Section */}
                                    {viewingReport.supplies && Object.keys(viewingReport.supplies).some(key => viewingReport.supplies[key]) && (
                                        <div className={`rounded-lg p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-brand-green-400' : 'text-brand-green-600'}`}>
                                                📦 Supplies Used
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                                {Object.entries(viewingReport.supplies).map(([key, value]) => {
                                                    if (!value || value === '' || key === 'misc') return null;
                                                    
                                                    let label = key.replace(/([A-Z])/g, ' $1').replace(/([0-9]+)/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
                                                    
                                                    const numMatch = label.match(/\d+$/);
                                                    if (numMatch) {
                                                        const num = numMatch[0];
                                                        if (/cap|pipe|casing/i.test(label)) {
                                                            label = label.replace(new RegExp(num + '$'), num + '\"');
                                                        } else if (/concrete|grout|bentonite|sand/i.test(label)) {
                                                            label = label.replace(new RegExp(num + '$'), num + '#');
                                                        }
                                                    }
                                                    
                                                    return (
                                                        <div key={key} className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{label}:</span> <strong>{value}</strong>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {viewingReport.supplies.misc && (
                                                <div className={`mt-4 p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                                                    <div className="font-semibold mb-1">Miscellaneous:</div>
                                                    <div className="whitespace-pre-wrap">{viewingReport.supplies.misc}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Comments/Labor Section */}
                                    {viewingReport.commentsLabor && (
                                        <div className={`rounded-lg p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-brand-green-400' : 'text-brand-green-600'}`}>
                                                💬 Comments / Labor
                                            </h3>
                                            <div className={`p-4 rounded whitespace-pre-wrap ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
                                                {viewingReport.commentsLabor}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Close Button */}
                                    <div className="flex justify-center mt-6">
                                        <button
                                            onClick={() => setViewingReport(null)}
                                            className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
                                        >
                                            Close Report
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Analytics Modal */}
                    {showAnalytics && (
                        <div 
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                            onClick={() => setShowAnalytics(false)}
                        >
                            <div 
                                className={`w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className={`sticky top-0 z-10 p-6 border-b ${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-r from-blue-50 to-white border-gray-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <h2 className={`text-3xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                            📊 Analytics Dashboard
                                        </h2>
                                        <button
                                            onClick={() => setShowAnalytics(false)}
                                            className="text-3xl font-bold text-gray-500 hover:text-gray-700"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Analytics Content */}
                                <div className="p-6">
                                    {reports.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="text-6xl mb-4">📈</div>
                                            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                No data yet. Import some reports to see analytics!
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Overview Stats */}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                                <div className={`p-6 rounded-xl ${darkMode ? 'bg-gradient-to-br from-blue-900 to-blue-800' : 'bg-gradient-to-br from-blue-50 to-blue-100'} border-2 ${darkMode ? 'border-blue-700' : 'border-blue-200'}`}>
                                                    <div className="text-4xl font-bold text-blue-600">{reports.length}</div>
                                                    <div className={`text-sm font-medium mt-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Total Reports</div>
                                                </div>
                                                <div className={`p-6 rounded-xl ${darkMode ? 'bg-gradient-to-br from-green-900 to-green-800' : 'bg-gradient-to-br from-green-50 to-green-100'} border-2 ${darkMode ? 'border-green-700' : 'border-green-200'}`}>
                                                    <div className="text-4xl font-bold text-green-600">{stats.totalHours}</div>
                                                    <div className={`text-sm font-medium mt-1 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Total Hours Worked</div>
                                                </div>
                                                <div className={`p-6 rounded-xl ${darkMode ? 'bg-gradient-to-br from-purple-900 to-purple-800' : 'bg-gradient-to-br from-purple-50 to-purple-100'} border-2 ${darkMode ? 'border-purple-700' : 'border-purple-200'}`}>
                                                    <div className="text-4xl font-bold text-purple-600">{stats.totalFootage} ft</div>
                                                    <div className={`text-sm font-medium mt-1 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>Total Footage Drilled</div>
                                                </div>
                                                <div className={`p-6 rounded-xl ${darkMode ? 'bg-gradient-to-br from-orange-900 to-orange-800' : 'bg-gradient-to-br from-orange-50 to-orange-100'} border-2 ${darkMode ? 'border-orange-700' : 'border-orange-200'}`}>
                                                    <div className="text-4xl font-bold text-orange-600">{((stats.totalHours || 0) * 85).toFixed(0)}</div>
                                                    <div className={`text-sm font-medium mt-1 ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>Est. Revenue ($85/hr)</div>
                                                </div>
                                            </div>

                                            {/* Hours by Driller */}
                                            <div className={`p-6 rounded-xl mb-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                                    👷 Hours by Driller
                                                </h3>
                                                <div className="space-y-3">
                                                    {(() => {
                                                        const drillerHours = {};
                                                        reports.forEach(report => {
                                                            const driller = report.driller || 'Unknown';
                                                            const hours = (report.workDays?.reduce((sum, day) => {
                                                                return sum + (parseFloat(day.hoursDriving) || 0) + (parseFloat(day.hoursOnSite) || 0);
                                                            }, 0) || 0);
                                                            drillerHours[driller] = (drillerHours[driller] || 0) + hours;
                                                        });
                                                        const maxHours = Math.max(...Object.values(drillerHours));
                                                        return Object.entries(drillerHours).map(([driller, hours]) => (
                                                            <div key={driller} className="flex items-center gap-4">
                                                                <div className={`w-32 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{driller}</div>
                                                                <div className="flex-1">
                                                                    <div className={`h-8 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
                                                                        <div
                                                                            className="h-full bg-gradient-to-r from-green-500 to-green-600 flex items-center px-3 text-white font-bold text-sm"
                                                                            style={{ width: `${(hours / maxHours) * 100}%` }}
                                                                        >
                                                                            {hours.toFixed(1)} hrs
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Footage by Driller */}
                                            <div className={`p-6 rounded-xl mb-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                                                    🎯 Footage Drilled by Driller
                                                </h3>
                                                <div className="space-y-3">
                                                    {(() => {
                                                        const drillerFootage = {};
                                                        reports.forEach(report => {
                                                            const driller = report.driller || 'Unknown';
                                                            const footage = (report.borings?.reduce((sum, boring) => {
                                                                return sum + (parseFloat(boring.footage) || 0);
                                                            }, 0) || 0);
                                                            drillerFootage[driller] = (drillerFootage[driller] || 0) + footage;
                                                        });
                                                        const maxFootage = Math.max(...Object.values(drillerFootage));
                                                        return Object.entries(drillerFootage).map(([driller, footage]) => (
                                                            <div key={driller} className="flex items-center gap-4">
                                                                <div className={`w-32 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{driller}</div>
                                                                <div className="flex-1">
                                                                    <div className={`h-8 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
                                                                        <div
                                                                            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center px-3 text-white font-bold text-sm"
                                                                            style={{ width: `${(footage / maxFootage) * 100}%` }}
                                                                        >
                                                                            {footage.toFixed(0)} ft
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Reports by Client */}
                                            <div className={`p-6 rounded-xl mb-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                                    🏢 Reports by Client
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {(() => {
                                                        const clientCounts = {};
                                                        reports.forEach(report => {
                                                            const client = report.client || 'Unknown';
                                                            clientCounts[client] = (clientCounts[client] || 0) + 1;
                                                        });
                                                        return Object.entries(clientCounts)
                                                            .sort((a, b) => b[1] - a[1])
                                                            .map(([client, count]) => (
                                                                <div key={client} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} border-2 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                                                    <div className={`font-semibold mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{client}</div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="text-2xl font-bold text-blue-600">{count}</div>
                                                                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>reports</div>
                                                                    </div>
                                                                </div>
                                                            ));
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Status Breakdown */}
                                            <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                                                    📋 Report Status Breakdown
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className={`p-5 rounded-lg ${darkMode ? 'bg-yellow-900 bg-opacity-30' : 'bg-yellow-50'} border-2 ${darkMode ? 'border-yellow-700' : 'border-yellow-200'}`}>
                                                        <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
                                                        <div className={`text-sm font-medium mt-1 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>⏳ Pending Review</div>
                                                        <div className={`text-xs mt-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                                            {stats.total > 0 ? `${((stats.pending / stats.total) * 100).toFixed(0)}% of total` : '0%'}
                                                        </div>
                                                    </div>
                                                    <div className={`p-5 rounded-lg ${darkMode ? 'bg-green-900 bg-opacity-30' : 'bg-green-50'} border-2 ${darkMode ? 'border-green-700' : 'border-green-200'}`}>
                                                        <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
                                                        <div className={`text-sm font-medium mt-1 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>✓ Approved</div>
                                                        <div className={`text-xs mt-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                                            {stats.total > 0 ? `${((stats.approved / stats.total) * 100).toFixed(0)}% of total` : '0%'}
                                                        </div>
                                                    </div>
                                                    <div className={`p-5 rounded-lg ${darkMode ? 'bg-red-900 bg-opacity-30' : 'bg-red-50'} border-2 ${darkMode ? 'border-red-700' : 'border-red-200'}`}>
                                                        <div className="text-3xl font-bold text-red-600">{reports.filter(r => r.status === 'changes_requested').length}</div>
                                                        <div className={`text-sm font-medium mt-1 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>⚠ Changes Requested</div>
                                                        <div className={`text-xs mt-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                                            {stats.total > 0 ? `${((reports.filter(r => r.status === 'changes_requested').length / stats.total) * 100).toFixed(0)}% of total` : '0%'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    
                                    {/* Close Button */}
                                    <div className="flex justify-center mt-8">
                                        <button
                                            onClick={() => setShowAnalytics(false)}
                                            className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            Close Analytics
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Image Viewer Modal */}
                    {viewingImages && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
                            onClick={() => setViewingImages(null)}
                        >
                            <div
                                className="relative w-full h-full flex flex-col items-center justify-center p-4"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Close Button */}
                                <button
                                    onClick={() => setViewingImages(null)}
                                    className="absolute top-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full w-12 h-12 flex items-center justify-center text-3xl font-bold z-10"
                                >
                                    ×
                                </button>

                                {/* Image Counter */}
                                <div className="absolute top-4 left-4 text-white bg-black bg-opacity-50 px-4 py-2 rounded-lg font-semibold">
                                    {currentImageIndex + 1} / {viewingImages.length}
                                </div>

                                {/* Navigation Buttons */}
                                {viewingImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setCurrentImageIndex((currentImageIndex - 1 + viewingImages.length) % viewingImages.length)}
                                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold"
                                        >
                                            ‹
                                        </button>
                                        <button
                                            onClick={() => setCurrentImageIndex((currentImageIndex + 1) % viewingImages.length)}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold"
                                        >
                                            ›
                                        </button>
                                    </>
                                )}

                                {/* Image Display */}
                                <div className="max-w-full max-h-full flex items-center justify-center">
                                    <img
                                        src={viewingImages[currentImageIndex].dataURL}
                                        alt={viewingImages[currentImageIndex].name || `Image ${currentImageIndex + 1}`}
                                        className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                                    />
                                </div>

                                {/* Image Info */}
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-6 py-3 rounded-lg text-center max-w-xl">
                                    <div className="font-semibold">{viewingImages[currentImageIndex].name || `Image ${currentImageIndex + 1}`}</div>
                                    {viewingImages[currentImageIndex].description && (
                                        <div className="text-sm mt-1">{viewingImages[currentImageIndex].description}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // Render app immediately - modules are already loaded when this script runs
        console.log('Dashboard app script loaded, rendering...');
        ReactDOM.render(<BossDashboard />, document.getElementById('root'));
