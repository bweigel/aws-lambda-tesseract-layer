FROM public.ecr.aws/sam/build-python3.8:1.62.0

WORKDIR /asset
COPY requirements.txt /asset/requirements.txt
COPY handler.py /asset/handler.py

RUN pip install -r requirements.txt -t /asset/ --only-binary=:all:  --implementation cp