import {
  Image,
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ToastAndroid,
  Alert,
  Platform,
} from 'react-native';
import React, { useState } from "react";
import GlobalApi from "../../utils/GlobalApi";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import Color from "../../utils/Color";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useUser } from "@clerk/clerk-expo";

const { width } = Dimensions.get("window");

export default function BookingListItem({ business, booking }) {
  const [isFeedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [isCancelModalVisible, setCancelModalVisible] = useState(false); // State for cancel modal
  const [feedback, setFeedback] = useState({ rating: 0, note: "" });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const { user } = useUser();
  const [bookingList, setBookingList] = useState([]);

  // Function to show cross-platform toast/alert
  const showToastOrAlert = (message) => {
    Platform.select({
      android: () => ToastAndroid.show(message, ToastAndroid.SHORT),
      ios: () => Alert.alert("Notification", message),
    })();
  };


  // Function to dynamically set status color based on booking status
  const getStatusStyles = (status) => {
    switch (status) {
      case "Booked":
        return [styles.bookingStatus, styles.booked];
      case "Cancelled":
        return [styles.bookingStatus, styles.cancelled];
      case "Completed":
        return [styles.bookingStatus, styles.completed];
      default:
        return styles.bookingStatus;
    }
  };

  const openFeedbackModal = () => {
    setSelectedBooking(booking);
    setFeedback({
      rating: booking?.feedback?.rating || 0,
      note: booking?.feedback?.note || "",
    });
    setFeedbackModalVisible(true);
  };

  const handleStarPress = (rating) => {
    setFeedback({ ...feedback, rating });
  };

  const submitFeedback = () => {
    if (!selectedBooking) return;

    // Prepare feedback data
    const feedbackData = {
      rating: feedback.rating,
      note: feedback.note,
      bookingId: selectedBooking.id,
      userId: user?.id,
      userEmail: user?.emailAddresses[0]?.emailAddress, // Extract email address from Clerk
    };

    // Call the API to submit feedback
    GlobalApi.submitFeedback(feedbackData)
      .then(() => {
        // Update local booking list with new feedback
        const updatedBookings = bookingList.map((item) =>
          item.id === selectedBooking.id ? { ...item, feedback } : item
        );
        setBookingList(updatedBookings);
        setFeedbackModalVisible(false);

        // Show a success notification
        showToastOrAlert("Feedback submitted!");
      })
      .catch((error) => {
        console.error("Error submitting feedback:", error);
      });
  };

  // Cancel booking function
  const handleCancelBooking = () => {
    setCancelModalVisible(true); // Open custom cancel modal
  };

  const confirmCancelBooking = () => {
    if (!booking?.id) return;

    // Call API to cancel the booking
    GlobalApi.cancelBooking(booking.id)
      .then(() => {
        // Update the booking status locally
        const updatedBookings = bookingList.map((item) =>
          item.id === booking.id ? { ...item, bookingStatus: "Cancelled" } : item
        );
        setBookingList(updatedBookings);

        // Show a success notification
        showToastOrAlert("Booking cancelled!");
        setCancelModalVisible(false); // Close the modal after success
      })
      .catch((error) => {
        console.error("Error cancelling booking:", error);
      });
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: business?.images?.[0]?.url }} style={styles.image} />
      <View style={styles.subContainer}>
        <Text style={styles.contactPerson}>{business?.contactPerson}</Text>
        <Text style={styles.businessName}>{business?.name}</Text>


        {/* Booking status and feedback button */}
        {booking?.bookingStatus && (
          <View style={styles.statusFeedbackContainer}>
            <Text style={getStatusStyles(booking.bookingStatus)}>
              {booking.bookingStatus}
            </Text>

            {/* Show Feedback button only if status is "Completed" */}
            {booking?.bookingStatus === "Completed" && (
              <TouchableOpacity
                style={styles.feedbackButton}
                onPress={openFeedbackModal}
              >
                <Text style={styles.feedbackButtonText}>Feedback</Text>
              </TouchableOpacity>
            )}

            {/* Cancel button */}
            {booking?.bookingStatus === "Booked" && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelBooking}
              >
                <Text style={styles.cancelButtonText}>Cancel Booking</Text>
              </TouchableOpacity>
            )}
          </View>
        )}


        {booking?.date && booking?.time && (
          <View style={styles.dateTimeContainer}>
            <Ionicons name="calendar" size={wp(6)} color={Color.PRIMARY} style={styles.calendarIcon} />
            <Text style={styles.bookingDateTime}>
              {formatDate(booking.date)} at {booking.time}
            </Text>
          </View>
        )}
      </View>

      {/* Feedback Modal */}
      <Modal
        transparent={true}
        visible={isFeedbackModalVisible}
        animationType="slide"
        onRequestClose={() => setFeedbackModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Give Feedback</Text>

            {/* Star Rating */}
            <View style={styles.starContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleStarPress(star)}
                >
                  <Ionicons
                    name={star <= feedback.rating ? "star" : "star-outline"}
                    size={wp("8%")}
                    color={star <= feedback.rating ? "#ffd700" : "#cccccc"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Note Section */}
            <TextInput
              style={styles.noteInput}
              placeholder="Write your feedback..."
              value={feedback.note}
              onChangeText={(text) => setFeedback({ ...feedback, note: text })}
              multiline
            />

            {/* Submit and Cancel Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={submitFeedback}>
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "gray" }]}
                onPress={() => setFeedbackModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        transparent={true}
        visible={isCancelModalVisible}
        animationType="slide"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Confirm Cancellation</Text>
            <Text style={styles.modalText}>Are you sure you want to cancel this booking?</Text>

            {/* Confirm and Cancel Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={confirmCancelBooking}>
                <Text style={styles.buttonText}>Yes, Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "gray" }]}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.buttonText}>No, Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: wp("30%"),
    height: wp("30%"),
    borderRadius: wp("3%"),
  },
  container: {
    padding: wp("3%"),
    backgroundColor: "white",
    borderRadius: wp("3%"),
    marginBottom: hp("2%"),
    flexDirection: "row",
    gap: wp("3%"),
  },
  subContainer: {
    flex: 1,
    gap: hp("1.5%"),
  },
  contactPerson: {
    fontFamily: "outfit",
    color: "gray",
    fontSize: wp("3.7%"),
  },
  businessName: {
    fontFamily: "outfit-bold",
    fontSize: wp("4.5%"),
  },
  dateTimeContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center", // Align icon and text vertically
  },
  bookingDateTime: {
    fontFamily: "outfit",
    color: "gray",
    fontSize: wp("4%"),
  },
  calendarIcon: {
    marginRight: wp("2%"),
  },
  statusFeedbackContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: wp("2%"),
  },
  bookingStatus: {
    paddingVertical: wp("0.5%"),
    paddingHorizontal: wp("2%"),
    borderRadius: wp("2%"),
    fontSize: wp("3.8%"),
    color: "white",
  },
  feedbackButton: {
    backgroundColor: Color.PRIMARY,
    padding: wp("1%"),
    borderRadius: wp("1%"),
    paddingHorizontal: wp("2%"),
  },
  feedbackButtonText: {
    color: "white",
    fontSize: wp("3.5%"),
    fontWeight: "500",
  },
  cancelButton: {
    backgroundColor: "red",
    padding: wp("1%"),
    borderRadius: wp("1%"),
    paddingHorizontal: wp("2%"),
  },
  cancelButtonText: {
    color: "white",
    fontSize: wp("3.5%"),
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: hp("3%"),
    marginHorizontal: wp("5%"),
    borderRadius: wp("3%"),
    alignItems: "center",
  },
  modalHeading: {
    fontSize: wp("6%"),
    marginBottom: hp("2%"),
    fontFamily: "outfit-bold",
  },
  modalText: {
    fontSize: wp("4.5%"),
    marginBottom: hp("2%"),
    textAlign: "center",
  },
  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: hp("2%"),
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#cccccc",
    width: "100%",
    padding: hp("1.5%"),
    borderRadius: wp("2%"),
    marginBottom: hp("2%"),
    fontSize: wp("4%"),
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  button: {
    backgroundColor: Color.PRIMARY,
    padding: hp("1.5%"),
    borderRadius: wp("2%"),
    width: "45%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: wp("4.5%"),
    fontWeight: "600",
  },
  booked: {
    color: "white",
    backgroundColor: "blue",
  },
  cancelled: {
    color: "white",
    backgroundColor: "red",
  },
  completed: {
    color: "white",
    backgroundColor: "green",
  },
});

// Function to format the date
const formatDate = (date) => {
  const options = { day: "2-digit", month: "short", year: "numeric" };
  return new Date(date).toLocaleDateString("en-GB", options).replace(/,/g, "");
};