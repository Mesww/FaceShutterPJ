from datetime import datetime, time

def is_start_work(check_in_time):
    # Define start work period from 8:00 am to 8:30 am
    start_work_start = time(1, 15)
    start_work_end = time(2, 40)
    return start_work_start <= check_in_time.time() <= start_work_end

def is_end_work(check_out_time):
    # Define end work period from 4:00 pm to 5:00 pm
    end_work_start = time(3, 15)  # 4:00 pm
    end_work_end = time(3, 40)    # 5:00 pm
    return end_work_start <= check_out_time.time() <= end_work_end

