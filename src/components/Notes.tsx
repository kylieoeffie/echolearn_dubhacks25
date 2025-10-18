import { useState, useEffect } from 'react';
import { Mic, MicOff, Save, Trash2, Plus, Edit2, X, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { TextToSpeech } from './TextToSpeech';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setContent(prev => prev + finalTranscript);
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }

    loadNotes();
  }, [user]);

  const loadNotes = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setNotes(data);
    }

    setLoading(false);
  };

  const startRecording = () => {
    if (recognition) {
      recognition.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  const saveNote = async () => {
    if (!user || !title.trim()) return;

    setSaving(true);

    if (selectedNote) {
      const { error } = await supabase
        .from('notes')
        .update({
          title,
          content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedNote.id);

      if (!error) {
        await loadNotes();
        setIsEditing(false);
      }
    } else {
      const { error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title,
          content,
        });

      if (!error) {
        await loadNotes();
        resetForm();
      }
    }

    setSaving(false);
  };

  const deleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (!error) {
      await loadNotes();
      if (selectedNote?.id === id) {
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSelectedNote(null);
    setIsEditing(false);
  };

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsEditing(false);
  };

  const editNote = () => {
    setIsEditing(true);
  };

  const createNewNote = () => {
    resetForm();
    setIsEditing(true);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-6 overflow-y-auto max-h-[calc(100vh-12rem)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">My Notes</h3>
          <button
            onClick={createNewNote}
            className="bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700 transition"
            title="New note"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No notes yet</p>
            <p className="text-sm">Create your first note</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => selectNote(note)}
                className={`p-4 rounded-lg cursor-pointer transition ${
                  selectedNote?.id === note.id
                    ? 'bg-teal-100 border-2 border-teal-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <h4 className="font-semibold text-gray-900 truncate">{note.title}</h4>
                <p className="text-sm text-gray-600 truncate">{note.content || 'Empty note'}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(note.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {isEditing ? (selectedNote ? 'Edit Note' : 'New Note') : 'Note Details'}
            </h3>
            <div className="flex gap-2">
              {selectedNote && !isEditing && (
                <>
                  <button
                    onClick={editNote}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteNote(selectedNote.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              )}
              {isEditing && (
                <button
                  onClick={resetForm}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              )}
            </div>
          </div>

          {isEditing || selectedNote ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition disabled:bg-gray-50"
                  placeholder="Note title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition resize-none disabled:bg-gray-50"
                  rows={10}
                  placeholder="Start typing or use speech-to-text..."
                />
              </div>

              {isEditing && (
                <div className="flex gap-3">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={!recognition}
                    className={`flex-1 ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-teal-600 hover:bg-teal-700'
                    } text-white py-3 px-4 rounded-lg font-semibold focus:ring-4 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-5 h-5" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5" />
                        Start Recording
                      </>
                    )}
                  </button>
                  <button
                    onClick={saveNote}
                    disabled={saving || !title.trim()}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Note
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select a note to view or create a new one</p>
            </div>
          )}
        </div>

        {selectedNote && !isEditing && content && (
          <TextToSpeech text={content} />
        )}
      </div>
    </div>
  );
}
