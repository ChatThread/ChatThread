import { INVALID_FILE_SIZE_ALERT } from "@/constants/alerts-constants";
import { useUtilityStore } from "@/stores/utility-store";
import { formatFileSize } from "@/utils/string-manipulation";
const useFileSizeValidator = () => {
  const maxFileSizeUpload = useUtilityStore((state) => state.maxFileSizeUpload);

  const validateFileSize = (file) => {
    if (file.size > maxFileSizeUpload) {
      throw new Error(
        INVALID_FILE_SIZE_ALERT(formatFileSize(maxFileSizeUpload)),
      );
    }
    return true;
  };

  return { validateFileSize };
};

export default useFileSizeValidator;
