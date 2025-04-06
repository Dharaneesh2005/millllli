import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Plus } from "lucide-react";

// Define a local interface for reviews to avoid import issues
interface ReviewData {
  id: string;
  name: string;
  avatar?: string;
  date: string;
  rating: number;
  comment: string;
  helpfulCount: number;
}

interface ReviewManagerProps {
  reviews: ReviewData[];
  onChange: (reviews: ReviewData[]) => void;
}

export default function ReviewManager({ reviews, onChange }: ReviewManagerProps) {
  const [editingReview, setEditingReview] = useState<ReviewData | null>(null);
  const [editIndex, setEditIndex] = useState<number>(-1);
  
  const handleAddReview = () => {
    const newReview: ReviewData = {
      id: Date.now().toString(),
      name: "",
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      rating: 5,
      comment: "",
      helpfulCount: 0
    };
    setEditingReview(newReview);
    setEditIndex(-1);
  };
  
  const handleEditReview = (review: ReviewData, index: number) => {
    setEditingReview({ ...review });
    setEditIndex(index);
  };
  
  const handleDeleteReview = (index: number) => {
    const updatedReviews = [...reviews];
    updatedReviews.splice(index, 1);
    // Pass updated reviews to parent component to sync review count
    onChange(updatedReviews);
  };
  
  const handleSaveReview = () => {
    if (!editingReview) return;
    
    const updatedReviews = [...reviews];
    if (editIndex >= 0) {
      // Update existing review
      updatedReviews[editIndex] = editingReview;
    } else {
      // Add new review
      updatedReviews.push(editingReview);
    }
    
    // Pass updated reviews to parent component
    onChange(updatedReviews);
    setEditingReview(null);
    setEditIndex(-1);
  };
  
  const handleCancelEdit = () => {
    setEditingReview(null);
    setEditIndex(-1);
  };
  
  return (
    <Card className="border">
      <CardContent className="pt-6">
        {editingReview ? (
          // Edit/Add Review Form
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reviewName">Customer Name</Label>
                <Input 
                  id="reviewName" 
                  value={editingReview.name}
                  onChange={(e) => setEditingReview({...editingReview, name: e.target.value})}
                  placeholder="Customer name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reviewAvatar">Avatar URL (optional)</Label>
                <Input 
                  id="reviewAvatar" 
                  value={editingReview.avatar || ''}
                  onChange={(e) => setEditingReview({...editingReview, avatar: e.target.value})}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reviewDate">Review Date</Label>
                <Input 
                  id="reviewDate" 
                  value={editingReview.date}
                  onChange={(e) => setEditingReview({...editingReview, date: e.target.value})}
                  placeholder="April 1, 2023"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reviewRating">Rating (1-5)</Label>
                <div className="flex items-center space-x-4">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button 
                      key={rating}
                      type="button"
                      variant={editingReview.rating >= rating ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setEditingReview({...editingReview, rating})}
                    >
                      {rating}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reviewComment">Review Comment</Label>
              <Textarea 
                id="reviewComment" 
                value={editingReview.comment}
                onChange={(e) => setEditingReview({...editingReview, comment: e.target.value})}
                placeholder="Customer review comment"
                className="min-h-20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="helpfulCount">Helpful Count</Label>
              <Input 
                id="helpfulCount" 
                type="number" 
                min="0"
                value={editingReview.helpfulCount}
                onChange={(e) => setEditingReview({...editingReview, helpfulCount: parseInt(e.target.value) || 0})}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
              <Button onClick={handleSaveReview}>Save Review</Button>
            </div>
          </div>
        ) : (
          // Reviews List
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No reviews yet. Add your first review!
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <div key={review.id} className="flex items-start justify-between border-b pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{review.name}</span>
                        <span className="text-muted-foreground text-sm">{review.date}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < review.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} 
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditReview(review, index)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteReview(index)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-center pt-2">
              <Button 
                onClick={handleAddReview}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Review
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}